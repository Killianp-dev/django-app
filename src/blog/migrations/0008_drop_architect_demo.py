from django.db import migrations


def drop_architect_demo(apps, schema_editor):
    """Retire les tables et le compte de l'ancienne démo architecte."""
    tables = [
        "archi_portfolio_projectphoto",
        "archi_portfolio_project_types_mission",
        "archi_portfolio_project",
        "archi_portfolio_missiontype",
        "archi_cabinet_sitesettings",
        "archi_contact_contact",
    ]
    vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        for table in tables:
            if vendor == "postgresql":
                cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
            else:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
        cursor.execute(
            "DELETE FROM django_migrations WHERE app IN "
            "('archi_cabinet', 'archi_portfolio', 'archi_contact')"
        )

    User = apps.get_model("auth", "User")
    Group = apps.get_model("auth", "Group")
    ContentType = apps.get_model("contenttypes", "ContentType")
    User.objects.filter(username="demo").update(is_active=False, is_staff=False, is_superuser=False)
    Group.objects.filter(name="demo").delete()
    ContentType.objects.filter(
        app_label__in=["archi_cabinet", "archi_portfolio", "archi_contact"]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0007_blogimage"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.RunPython(drop_architect_demo, migrations.RunPython.noop),
    ]
