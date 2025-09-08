import boto3
import re
import os

# This script removes any messages which have uppercase ID in the url

env_name = os.environ['NHS_ENVIRONMENT']

if env_name != 'dev' and env_name != 'test':
    raise RuntimeError('NHS_ENVIRONMENT must be set')

s3 = boto3.resource('s3')
b = s3.Bucket(env_name + '-ehr-repo-bucket')

upper_pattern = re.compile("^.*([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12}).*$")

for obj in b.objects.all():
    if upper_pattern.match(obj.key):
        print("Will be deleted", obj.key)
        path, filename = os.path.split(obj.key)
        if filename and filename != '':
            print("Downloading to", obj.key)
            os.makedirs(path, exist_ok=True)
            b.download_file(obj.key, obj.key)
        obj.delete()
        print("Deleted", obj.key)
    else:
        print("Looks OK", obj.key)
