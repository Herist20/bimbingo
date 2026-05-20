'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { LecturerCombobox } from '@/components/lecturers/lecturer-combobox';
import { attachLecturer, detachLecturer, type ProjectLecturerLink } from '@/lib/actions/projects';
import {
  LECTURER_ROLE_LABEL,
  LECTURER_ROLES,
  type LecturerRole,
} from '@/lib/schemas/project';
import type { LecturerRow } from '@/lib/actions/lecturers';

interface LecturerAssignmentsProps {
  projectId: string;
  initial: ProjectLecturerLink[];
}

function toLecturerRow(l: ProjectLecturerLink): LecturerRow | null {
  if (!l.lecturer) return null;
  return {
    id: l.lecturer.id,
    full_name: l.lecturer.full_name,
    title: l.lecturer.title,
    university: l.lecturer.university,
    faculty: null,
    email: null,
    whatsapp: null,
    characteristics: null,
    tags: [],
    created_at: '',
    updated_at: '',
  };
}

export function LecturerAssignments({ projectId, initial }: LecturerAssignmentsProps) {
  const [byRole, setByRole] = React.useState<Record<string, ProjectLecturerLink | undefined>>(() => {
    const map: Record<string, ProjectLecturerLink | undefined> = {};
    for (const l of initial) map[l.role] = l;
    return map;
  });
  const [pending, startTransition] = React.useTransition();

  const handleSelect = (role: LecturerRole, lecturer: LecturerRow | null) => {
    if (!lecturer) {
      startTransition(async () => {
        const result = await detachLecturer(projectId, role);
        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
        setByRole((prev) => ({ ...prev, [role]: undefined }));
        toast.success(`${LECTURER_ROLE_LABEL[role]} dilepas.`);
      });
      return;
    }
    startTransition(async () => {
      const result = await attachLecturer(projectId, lecturer.id, role);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setByRole((prev) => ({
        ...prev,
        [role]: {
          project_id: projectId,
          lecturer_id: lecturer.id,
          role,
          lecturer: {
            id: lecturer.id,
            full_name: lecturer.full_name,
            title: lecturer.title,
            university: lecturer.university,
          },
        },
      }));
      toast.success(`${LECTURER_ROLE_LABEL[role]} diatur.`);
    });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {LECTURER_ROLES.map((role) => {
        const current = byRole[role];
        const currentRow = current ? toLecturerRow(current) : null;
        return (
          <Field key={role} label={LECTURER_ROLE_LABEL[role]}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <LecturerCombobox
                  value={current?.lecturer_id ?? null}
                  initialOption={currentRow}
                  onChange={(l) => handleSelect(role, l)}
                  placeholder={`Pilih ${LECTURER_ROLE_LABEL[role].toLowerCase()}…`}
                  disabled={pending}
                />
              </div>
              {current ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Lepas ${LECTURER_ROLE_LABEL[role]}`}
                  onClick={() => handleSelect(role, null)}
                  disabled={pending}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </Field>
        );
      })}
    </div>
  );
}
