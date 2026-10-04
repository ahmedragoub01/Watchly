export function toUserResponse(row: any) {
  return {
    id: row.id,
    email: row.email ?? undefined,
    displayName: row.display_name ?? row.displayName ?? '',
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}
