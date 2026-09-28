import { Button, Popover, Toggle } from '@rinzai/zen';
import { useState } from 'react';

export default function Settings() {
    const [settings, setSettings] = useState({ notifications: true, sounds: false, autoSave: true });
    const rows = [
        { key: 'notifications', label: 'Notifications' },
        { key: 'sounds', label: 'Sounds' },
        { key: 'autoSave', label: 'Auto-save' },
    ] as const;
    return (
        <Popover
            role="dialog"
            content={
                <div className="flex w-60 flex-col gap-3 p-4">
                    <p className="text-sm font-semibold">Preferences</p>
                    {rows.map(({ key, label }) => (
                        <label key={key} className="flex items-center justify-between font-normal">
                            {label}
                            <Toggle
                                checked={settings[key]}
                                onChange={(on) => setSettings((s) => ({ ...s, [key]: on }))}
                            />
                        </label>
                    ))}
                </div>
            }
        >
            <Button variant="outline">Preferences</Button>
        </Popover>
    );
}
