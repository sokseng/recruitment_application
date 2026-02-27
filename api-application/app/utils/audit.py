from datetime import datetime
from sqlalchemy.inspection import inspect
from app.models.audit_trace_model import AuditTrace

def audit_log(
    db,
    db_obj,
    action: str,
    user_name: str,
    ip_address: str = "",
    exclude_fields: list = None,
    value_formatters: dict = None,
    field_rename: dict = None,
    is_delete: bool = False
):
    exclude_fields = exclude_fields or []
    value_formatters = value_formatters or {}
    field_rename = field_rename or {}

    state = inspect(db_obj)
    changes = []

    for attr in state.attrs:
        if attr.key in exclude_fields:
            continue

        old = attr.value
        new = "DELETED" if is_delete else old  # For delete, new is special

        if not is_delete:
            hist = attr.history
            if hist.has_changes():
                old = hist.deleted[0] if hist.deleted else None
                new = hist.added[0] if hist.added else None
            else:
                continue  # Skip unchanged fields

        # Apply custom formatter if provided
        if attr.key in value_formatters:
            formatter = value_formatters[attr.key]
            old = formatter(db, old)
            new = formatter(db, new)

        display_name = field_rename.get(attr.key, attr.key)
        changes.append(f"{display_name}: '{old if old is not None else 'NULL'}' → '{new if new is not None else 'NULL'}'")

    # Special case: Cancelled JobApplication
    if action.lower().startswith("cancel") and hasattr(db_obj, "job"):
        job_name = getattr(db_obj.job, "job_title", f"Job #{getattr(db_obj, 'job_id', 'Unknown')}")
        company_name = getattr(db_obj.job.employer, "company_name", "Unknown Company") if hasattr(db_obj.job, "employer") else "Unknown Company"
        reason_text = getattr(db_obj, "reason", "NULL")
        changes = [f"{job_name}: Cancelled | company: {company_name} | Reason: {reason_text}"]

    if not changes:
        return

    audit = AuditTrace(
        user_action=user_name,
        action_datetime=datetime.now().replace(microsecond=0),
        action=action,
        ip=ip_address,
        detail_information=" | ".join(changes)
    )

    db.add(audit)
    db.commit()