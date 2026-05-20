'use client';

import * as React from 'react';
import { FileUploader } from './file-uploader';
import { FileList } from './file-list';
import type { FileRow } from '@/lib/actions/files';

interface FilesSectionProps {
  projectId: string;
  initial: FileRow[];
}

export function FilesSection({ projectId, initial }: FilesSectionProps) {
  const [files, setFiles] = React.useState<FileRow[]>(initial);

  React.useEffect(() => setFiles(initial), [initial]);

  return (
    <div className="flex flex-col gap-6">
      <FileUploader
        projectId={projectId}
        onUploaded={(f) => setFiles((prev) => [f, ...prev])}
      />
      <FileList data={files} onDeleted={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))} />
    </div>
  );
}
