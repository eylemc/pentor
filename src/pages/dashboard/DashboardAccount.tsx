import { User, Mail, Lock, Trash2, Bell } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useState } from 'react';
import { accountData } from '@/data/dashboard';
import { useToast } from '@/components/ui/Toast';

export function DashboardAccount() {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifications, setNotifications] = useState(accountData.notifications);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Account</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader title="Profile" icon={<User className="w-5 h-5" />} />
        <CardBody className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Name</label>
              <input type="text" defaultValue={accountData.name} className="input-base" />
            </div>
            <div>
              <label className="label-base">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" defaultValue={accountData.email} className="input-base pl-10" readOnly />
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => toast('Profile saved (demo).', 'success')}>Save changes</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password & security" icon={<Lock className="w-5 h-5" />} />
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Password</p>
              <p className="text-xs text-gray-500">Last changed 3 months ago</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast('Password change coming soon.', 'info')}>Change password</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notification preferences" icon={<Bell className="w-5 h-5" />} />
        <CardBody className="space-y-3">
          {notifications.map((n, i) => (
            <label key={n.type} className="flex items-center justify-between p-3 rounded-lg bg-ink-900/40 border border-ink-700/40 cursor-pointer">
              <span className="text-sm text-gray-300">{n.type}</span>
              <input
                type="checkbox"
                checked={n.enabled}
                onChange={(e) => {
                  setNotifications((prev) => prev.map((p, idx) => idx === i ? { ...p, enabled: e.target.checked } : p));
                  toast('Notification preference updated.', 'success');
                }}
                className="w-9 h-5 appearance-none rounded-full bg-ink-700 checked:bg-accent-500 relative transition-colors cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              />
            </label>
          ))}
        </CardBody>
      </Card>

      <Card className="border-danger-500/20">
        <CardHeader title="Danger zone" icon={<Trash2 className="w-5 h-5 text-danger-400" />} />
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-400">Permanently delete your account and all associated data. This cannot be undone.</p>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete account</Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => toast('Account deletion is not available in this demo.', 'info')}
        title="Delete account?"
        message="This will permanently remove your account, domains, tests, and reports. This action cannot be undone."
        confirmLabel="Delete permanently"
        danger
      />
    </div>
  );
}
