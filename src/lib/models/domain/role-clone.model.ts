/**
 * A permission of the source role that the clone did not receive, and the server's reason.
 *
 * The clone copies by giving the source's permissions to the new role through
 * `POST /roles/{id}/permissions`, which refuses a WHOLE request when any one permission in it is
 * not grantable (the host-only guard, `AssertRolePermissionGrantAllowedTask`, aborts 403). The
 * effect narrows a refused request down to the permissions that were refused and keeps the rest.
 */
export interface RoleCloneSkip {
  id: string;
  name: string;
  displayName?: string;
  reason: string;
}
