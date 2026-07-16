# Security Specification: Cloud Smart File Manager

This security specification implements **Phase 0: Payload-First Security TDD** for the smart cloud file manager in accordance with the Firebase Integration Skill instructions.

## 1. Data Invariants

1. **User Ownership**: No user can read, list, create, update, or delete folders or scan documents belonging to another user.
2. **Strict Identity**: The `userId` path variable must match the authenticated user's UID (`request.auth.uid`).
3. **Data Type and Size Constraints**: All custom folder and scan fields must be type-validated and size-bounded to prevent Denial of Wallet and ID Poisoning attacks.
4. **Immutability**: Crucial parameters such as `createdAt` or file parameters cannot be altered once created unless authorized.
5. **No Self-Privilege Escalation**: Users cannot upgrade their roles to `admin` or bypass resource quotas.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to bypass authorization, escalate privileges, inject invalid types, or poison document structures. Our security rules will guarantee that all of these return `PERMISSION_DENIED`.

### 1. Cross-Tenant ID Poisoning
*   **Target**: `/users/attackerUID/scans/poisonedId`
*   **Attack**: Attacker attempts to create a scan document in user `victimUID`'s space.
*   **Payload**:
    ```json
    {
      "id": "poisonedId",
      "timestamp": 1789000000000,
      "file": {
        "id": "file_123",
        "name": "invoice.pdf",
        "size": 2048,
        "preview": "data:application/pdf;base64,...",
        "status": "idle"
      },
      "transactions": []
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Strict owner path matching block `isOwner(userId)`).

### 2. Privilege Escalation (Self-Admin Role Update)
*   **Target**: `/users/victimUID`
*   **Attack**: Standard user attempts to change their own role to `admin` or status to `active` after suspension.
*   **Payload**:
    ```json
    {
      "id": "victimUID",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active"
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by profile update rules restricting role modifications to admins only).

### 3. Folder Name Length Over-Exploitation
*   **Target**: `/users/victimUID/folders/folder_123`
*   **Attack**: User attempts to create a folder with a 10KB name string to perform a Denial of Wallet attack.
*   **Payload**:
    ```json
    {
      "name": "VeryLongFolderNameThatExceedsTheMaxAllowableSizeLimitOfOneHundredCharacters....................................................................................",
      "color": "rose",
      "createdAt": "2026-07-16T12:00:00Z"
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Enforced by `data.name.size() <= 100` size check).

### 4. Folder Invalid Color Tag Injection
*   **Target**: `/users/victimUID/folders/folder_123`
*   **Attack**: User attempts to set an unsupported color value.
*   **Payload**:
    ```json
    {
      "name": "Tax Invoices",
      "color": "super_gold_rgb_255_0_0",
      "createdAt": "2026-07-16T12:00:00Z"
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Verified by `data.color.size() <= 50`).

### 5. Document Type Mismatch (Injecting list into string)
*   **Target**: `/users/victimUID/scans/scan_123`
*   **Attack**: Attacker attempts to write a list into the `file.name` field.
*   **Payload**:
    ```json
    {
      "id": "scan_123",
      "timestamp": 1789000000000,
      "file": {
        "id": "file_123",
        "name": ["malicious", "list"],
        "size": 2048,
        "preview": "data:application/pdf;base64,...",
        "status": "idle"
      },
      "transactions": []
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Enforced by `file.name is string` rule).

### 6. Shadow Keys Update (Ghost Fields Injection)
*   **Target**: `/users/victimUID/folders/folder_123`
*   **Attack**: Attacker tries to inject a hidden state field `isApprovedByAdmin` to bypass payment locks.
*   **Payload**:
    ```json
    {
      "name": "Personal Invoices",
      "color": "blue",
      "createdAt": "2026-07-16T12:00:00Z",
      "isApprovedByAdmin": true
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Enforced by strict keys count matching `data.keys().size() == 3` or `4` helper).

### 7. File Size Type Pollution
*   **Target**: `/users/victimUID/scans/scan_123`
*   **Attack**: Attempt to inject non-integer values (string) into `file.size` field.
*   **Payload**:
    ```json
    {
      "id": "scan_123",
      "timestamp": 1789000000000,
      "file": {
        "id": "file_123",
        "name": "invoice.pdf",
        "size": "not-a-number",
        "preview": "data:image/png;base64,...",
        "status": "idle"
      },
      "transactions": []
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by `file.size is int` rule).

### 8. Orphaned Document Creation (Missing Fields)
*   **Target**: `/users/victimUID/scans/scan_123`
*   **Attack**: Attacker attempts to save an empty/incomplete scan item that would crash the frontend parser.
*   **Payload**:
    ```json
    {
      "id": "scan_123"
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by `.hasAll(['id', 'timestamp', 'file', 'transactions'])` validation).

### 9. ID Poisoning (Junk Character Strings)
*   **Target**: `/users/victimUID/folders/folder@#$$%^&*`
*   **Attack**: Injecting unsafe characters as document IDs to pollute index paths.
*   **Payload**:
    ```json
    {
      "name": "Safe Folder Name",
      "color": "emerald",
      "createdAt": "2026-07-16T12:00:00Z"
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by `isValidId(folderId)` regex checking `^[a-zA-Z0-9_\-]+$`).

### 10. Scan Base64 Format Corruption (Too Large or Array)
*   **Target**: `/users/victimUID/scans/scan_123`
*   **Attack**: Attempt to write array in preview field.
*   **Payload**:
    ```json
    {
      "id": "scan_123",
      "timestamp": 1789000000000,
      "file": {
        "id": "file_123",
        "name": "invoice.pdf",
        "size": 1000,
        "preview": ["binary_data", "binary_data_2"],
        "status": "idle"
      },
      "transactions": []
    }
    ```
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by `file.preview is string` type checking).

### 11. Cross-User List Operation Scraping
*   **Target**: `/users/victimUID/scans`
*   **Attack**: Attacker queries the whole collection of invoices without specifying they are the owner.
*   **Expected Result**: `PERMISSION_DENIED` (Checked by `isOwner(userId)`).

### 12. Non-authenticated Operations
*   **Target**: `/users/victimUID/folders/folder_123`
*   **Attack**: Guest/Anonymous user attempts to perform write operations without authenticating.
*   **Expected Result**: `PERMISSION_DENIED` (Blocked by `isSignedIn()` guard).

---

## 3. Security Test Specification

These payloads are validated against the rule set to ensure security:

```typescript
// Conceptual Test Runner
describe("Cloud File Manager Security Rules", () => {
  it("should deny cross-tenant scan document creations", async () => {
    const db = getFirestoreForUser("attackerUID");
    const docRef = doc(db, "users/victimUID/scans/poisonedId");
    await assertFails(setDoc(docRef, payload1));
  });

  it("should deny user self-role updates to admin", async () => {
    const db = getFirestoreForUser("victimUID");
    const docRef = doc(db, "users/victimUID");
    await assertFails(updateDoc(docRef, { role: "admin" }));
  });

  it("should enforce maximum name size bounds for folders", async () => {
    const db = getFirestoreForUser("victimUID");
    const docRef = doc(db, "users/victimUID/folders/folder_123");
    await assertFails(setDoc(docRef, payload3));
  });
});
```
