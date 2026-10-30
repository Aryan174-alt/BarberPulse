from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AddField(
            model_name='shop',
            name='photo',
            field=models.FileField(blank=True, upload_to='shop_photos/'),
        ),
    ]
