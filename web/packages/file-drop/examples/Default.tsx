import { FileDrop } from '@rinzai/zen';
import { useState } from 'react';

/** A bank statement to import: CSV or Excel, one at a time. */
export default function Default() {
    const [file, setFile] = useState<File>();
    return (
        <FileDrop accept=".csv,.xlsx" onFiles={([f]) => setFile(f)} className="w-full max-w-md">
            <span className="text-foreground font-medium">{file ? file.name : 'Drop a statement here'}</span>
            <span className="text-xs">
                {file ? `${Math.ceil(file.size / 1024)} KB · choose another` : 'CSV or Excel, or click to choose'}
            </span>
        </FileDrop>
    );
}
