import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type {
  AuditLog,
  NotificationOutboxItem,
  SchoolSettings,
  Student,
  UserProfile,
} from '../types/attendance';

interface UseNotificationOutboxParams {
  tenantId: string;
  currentTenant: { name: string };
  firebaseUser: FirebaseUser | null;
  canManageOutbox: boolean;
  allNotifications: NotificationOutboxItem[];
  setAllNotifications: React.Dispatch<React.SetStateAction<NotificationOutboxItem[]>>;
  students: Student[];
  settings: SchoolSettings;
  currentUser: UserProfile;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useNotificationOutbox({
  tenantId,
  currentTenant,
  firebaseUser,
  canManageOutbox,
  allNotifications,
  setAllNotifications,
  students,
  settings,
  currentUser,
  addAuditLog,
}: UseNotificationOutboxParams) {
  const retryNotification = async (id: string): Promise<boolean> => {
    const target = allNotifications.find((n) => n.id === id);
    if (!target) return false;

    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return false;
    }

    try {
      const res = await authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          channel: target.channel,
          notifications: [target],
        }),
      });

      const resJson = res.ok ? await res.json() : null;
      if (!res.ok || !resJson) {
        const reason = resJson?.error || 'No messaging gateway is configured for this school.';
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? { ...n, status: 'failed' as const, retryCount: n.retryCount + 1, errorReason: reason }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      const outcome = (resJson?.results?.find((r: any) => r.id === id) || resJson?.receipts?.[0] || null) as any;

      if (!outcome || outcome.status === 'manual') {
        // Nothing was transmitted (e.g. WhatsApp Web direct mode); the item stays queued.
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? { ...n, status: 'pending' as const, retryCount: n.retryCount + 1, errorReason: outcome?.errorReason }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      if (outcome.status === 'failed') {
        setAllNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: 'failed' as const,
                  retryCount: n.retryCount + 1,
                  errorReason: outcome.errorReason || 'Gateway rejected the message.',
                }
              : n
          );
          if (typeof localCache !== 'undefined') {
            localCache.setItem('school_notifications', JSON.stringify(updated));
          }
          return updated;
        });
        return false;
      }

      const receipt = resJson?.receipts?.find((r: any) => r.id === id) || outcome;

      setAllNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? {
                ...n,
                status: 'sent' as const,
                retryCount: n.retryCount + 1,
                sentAt: receipt?.sentAt || new Date().toISOString(),
                gatewayReceiptId: receipt?.gatewayReceiptId,
                gatewayProvider: receipt?.gatewayProvider,
                errorReason: undefined,
              }
            : n
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        entityType: 'settings',
        entityId: target.id,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إعادة إرسال إشعار ولي الأمر عبر (${target.channel}) للطالب (${target.studentName}) - رقم الإيصال: ${receipt?.gatewayReceiptId || 'بدون إيصال'}.`,
        detailsEn: `Resending the guardian notification via (${target.channel}) for student (${target.studentName}) - Receipt number: ${receipt?.gatewayReceiptId || 'No receipt'}.`,
      });

      return true;
    } catch (err: any) {
      const reason = err?.message || 'Network error while dispatching the notification.';
      console.error('Notification retry failed:', err);
      setAllNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? { ...n, status: 'failed' as const, retryCount: n.retryCount + 1, errorReason: reason }
            : n
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });
      return false;
    }
  };

  const retryAllFailedNotifications = async () => {
    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return;
    }

    const failedItems = allNotifications.filter((n) => n.tenantId === tenantId && n.status === 'failed');
    if (failedItems.length === 0) return;

    try {
      const res = await authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          notifications: failedItems,
        }),
      });

      const resJson = res.ok ? await res.json() : null;

      if (!res.ok || !resJson) {
        console.warn('Bulk notification retry aborted:', resJson?.error || `HTTP ${res.status}`);
        return;
      }

      const receiptMap = new Map<string, any>();
      if (Array.isArray(resJson?.receipts)) {
        for (const r of resJson.receipts) receiptMap.set(r.id, r);
      }
      const resultMap = new Map<string, any>();
      if (Array.isArray(resJson?.results)) {
        for (const r of resJson.results) resultMap.set(r.id, r);
      }

      const sentCount = failedItems.filter((n) => resultMap.get(n.id)?.status === 'sent').length;

      setAllNotifications((prev) => {
        const updated = prev.map((n) => {
          if (n.tenantId !== tenantId || n.status !== 'failed') return n;
          const outcome = resultMap.get(n.id) as any;
          if (!outcome || outcome.status === 'manual') {
            return { ...n, status: 'pending' as const, retryCount: n.retryCount + 1, errorReason: outcome?.errorReason };
          }
          if (outcome.status === 'failed') {
            return {
              ...n,
              status: 'failed' as const,
              retryCount: n.retryCount + 1,
              errorReason: outcome.errorReason || 'Gateway rejected the message.',
            };
          }
          const receipt = receiptMap.get(n.id) || outcome;
          return {
            ...n,
            status: 'sent' as const,
            retryCount: n.retryCount + 1,
            sentAt: receipt?.sentAt || new Date().toISOString(),
            gatewayReceiptId: receipt?.gatewayReceiptId,
            gatewayProvider: receipt?.gatewayProvider,
            errorReason: undefined,
          };
        });
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_notifications', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        entityType: 'settings',
        entityId: `bulk-retry-${tenantId}`,
        action: 'update',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إعادة محاولة إرسال الإشعارات المتعثرة (${failedItems.length} إشعار): تم إرسال ${sentCount} بنجاح عبر بوابة المشغل.`,
        detailsEn: `Retrying failed notifications (${failedItems.length} notifications): ${sentCount} sent successfully via the operator gateway.`,
      });
    } catch (err) {
      console.error('Bulk notification retry failed:', err);
    }
  };

  const sendCustomParentNotification = (params: {
    studentIds: string[];
    messageText: string;
    channel: 'SMS' | 'WhatsApp';
    category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
    absenceDate?: string;
  }): number => {
    if (!canManageOutbox) {
      console.warn('Unauthorized: Notification dispatch requires administrator or registrar privileges.');
      return 0;
    }

    const now = new Date().toISOString();
    const newItems: NotificationOutboxItem[] = [];

    params.studentIds.forEach((sid) => {
      const std = students.find((s) => s.id === sid);
      if (std) {
        // Dynamic templated token replacements
        const formattedMsg = params.messageText
          .replace(/\{student_name\}/g, std.fullName)
          .replace(/\{guardian_name\}/g, std.guardianName)
          .replace(/\{class_name\}/g, std.className)
          .replace(/\{absences_count\}/g, String(std.totalAbsences || 0))
          .replace(/\{school_name\}/g, currentTenant.name);

        const isAbsenceNotice = params.category === 'absence' || params.category === 'warning';
        const sessionTitle =
          params.category === 'absence'
            ? 'تذكير غياب مدرسي'
            : params.category === 'warning'
            ? 'إنذار غياب رسمي'
            : params.category === 'late'
            ? 'تنبيه تأخر صباحي'
            : params.category === 'broadcast'
            ? 'تعميم مدرسي عام'
            : 'إشعار مخصص';

        const item: NotificationOutboxItem = {
          id: `notif-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}-${std.id}`,
          tenantId,
          recipientPhone: std.guardianPhone,
          recipientName: std.guardianName,
          studentId: std.id,
          studentName: std.fullName,
          absenceDate: params.absenceDate || new Date().toISOString().split('T')[0],
          sessionTitle,
          statusType: isAbsenceNotice ? 'absent' : params.category === 'late' ? 'late' : 'present',
          category: params.category || 'broadcast',
          messageText: formattedMsg,
          channel: params.channel,
          status: 'pending',
          retryCount: 0,
          createdAt: now,
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setAllNotifications((prev) => [...newItems, ...prev]);

      // Fire asynchronous backend gateway dispatch
      authenticatedFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          channel: params.channel,
          notifications: newItems,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const newIds = new Set(newItems.map((item) => item.id));
          if (!data) {
            setAllNotifications((prev) =>
              prev.map((item) =>
                newIds.has(item.id)
                  ? { ...item, status: 'failed' as const, errorReason: 'No messaging gateway is configured for this school.' }
                  : item
              )
            );
            return;
          }

          const receiptMap = new Map<string, any>();
          if (Array.isArray(data?.receipts)) {
            data.receipts.forEach((r: any) => receiptMap.set(r.id, r));
          }
          const resultMap = new Map<string, any>();
          if (Array.isArray(data?.results)) {
            data.results.forEach((r: any) => resultMap.set(r.id, r));
          }

          setAllNotifications((prev) =>
            prev.map((item) => {
              if (!newIds.has(item.id)) return item;
              const outcome = resultMap.get(item.id) as any;
              if (!outcome || outcome.status === 'manual') {
                return { ...item, status: 'pending' as const, errorReason: outcome?.errorReason };
              }
              if (outcome.status === 'failed') {
                return {
                  ...item,
                  status: 'failed' as const,
                  errorReason: outcome.errorReason || 'Gateway rejected the message.',
                };
              }
              const receipt = receiptMap.get(item.id) || outcome;
              return {
                ...item,
                status: 'sent' as const,
                gatewayReceiptId: receipt?.gatewayReceiptId,
                gatewayProvider: receipt?.gatewayProvider,
                sentAt: receipt?.sentAt || new Date().toISOString(),
                errorReason: undefined,
              };
            })
          );
        })
        .catch((err) => {
          console.error('Backend notification dispatch failed:', err);
          const newIds = new Set(newItems.map((item) => item.id));
          setAllNotifications((prev) =>
            prev.map((item) =>
              newIds.has(item.id)
                ? { ...item, status: 'failed' as const, errorReason: 'Network error while contacting the messaging gateway.' }
                : item
            )
          );
        });

      if (firebaseUser) {
        newItems.forEach((n) => {
          setDoc(doc(db, 'notification_outbox', n.id), {
            tenantId: n.tenantId,
            recipientPhone: n.recipientPhone,
            recipientName: n.recipientName,
            studentName: n.studentName,
            absenceDate: n.absenceDate,
            messageText: n.messageText,
            channel: n.channel,
            status: n.status,
            retryCount: n.retryCount,
            gatewayReceiptId: n.gatewayReceiptId,
            gatewayProvider: n.gatewayProvider,
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `notification_outbox/${n.id}`);
          });
        });
      }

      addAuditLog({
        entityType: 'settings',
        entityId: `broadcast-${Date.now()}`,
        action: 'create',
        performerId: currentUser.id,
        performerName: currentUser.name,
        performerRole: currentUser.role,
        details: `إرسال وبث رسائل مخصصة لأولياء الأمور: تم إدراج ${newItems.length} رسالة في الطابور عبر (${params.channel}).`,
        detailsEn: `Sending and broadcasting custom messages to guardians: ${newItems.length} messages were queued via (${params.channel}).`,
      });
    }

    return newItems.length;
  };

  const sendChronicWarningNotification = (studentId: string, warningTier: number): boolean => {
    const std = students.find((s) => s.id === studentId);
    if (!std) return false;

    const tierLabels: Record<number, string> = {
      1: 'الإنذار الأكاديمي الأول (3 أيام غياب)',
      2: 'الإنذار الأكاديمي الثاني واستدعاء ولي الأمر (5 أيام غياب)',
      3: 'إشعار حرمان وتوجيه وزاري (7+ أيام غياب)',
    };

    const tierLabel = tierLabels[warningTier] || `إنذار غياب رسمي (${std.totalAbsences} أيام)`;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const template = settings.warningMessageTemplate || 'إشعار رسمي: المكرم ولي أمر الطالب ({student_name})، نظراً لتجاوز أيام الغياب غير المبررة الحد المسموح، نأمل مراجعة إدارة المدرسة عاجلاً.';
    const message = template
      .replace('{student_name}', std.fullName)
      .concat(` [المستوى: ${tierLabel}]`);

    const warningItem: NotificationOutboxItem = {
      id: `notif-warn-${Date.now()}-${std.id}`,
      tenantId,
      recipientPhone: std.guardianPhone,
      recipientName: std.guardianName,
      studentId: std.id,
      studentName: std.fullName,
      absenceDate: today,
      sessionTitle: tierLabel,
      statusType: 'absent',
      category: 'warning',
      messageText: message,
      channel: settings.preferredChannel === 'WhatsApp' ? 'WhatsApp' : 'SMS',
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    };

    setAllNotifications((prev) => [warningItem, ...prev]);

    if (firebaseUser) {
      setDoc(doc(db, 'notification_outbox', warningItem.id), {
        tenantId: warningItem.tenantId,
        recipientPhone: warningItem.recipientPhone,
        recipientName: warningItem.recipientName,
        studentName: warningItem.studentName,
        absenceDate: warningItem.absenceDate,
        messageText: warningItem.messageText,
        channel: warningItem.channel,
        status: warningItem.status,
        retryCount: warningItem.retryCount,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notification_outbox/${warningItem.id}`);
      });
    }

    addAuditLog({
      entityType: 'student',
      entityId: std.id,
      action: 'create',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `إرسال إنذار غياب تراكمي لولي أمر الطالب ${std.fullName}: ${tierLabel}.`,
      detailsEn: `Sending a cumulative absence warning to the guardian of student ${std.fullName}: ${tierLabel}.`,
    });

    return true;
  };

  const sendAllChronicWarningNotifications = (tierThreshold = 3): number => {
    const eligibleStudents = students.filter((s) => s.totalAbsences >= tierThreshold);
    let sent = 0;
    eligibleStudents.forEach((s) => {
      const tier = s.totalAbsences >= 7 ? 3 : s.totalAbsences >= 5 ? 2 : 1;
      if (sendChronicWarningNotification(s.id, tier)) {
        sent++;
      }
    });
    return sent;
  };
  return {
    retryNotification,
    retryAllFailedNotifications,
    sendCustomParentNotification,
    sendChronicWarningNotification,
    sendAllChronicWarningNotifications,
  };
}
