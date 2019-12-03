#!/bin/sh
aws s3 sync --exclude upload.sh --storage-class ONEZONE_IA . s3://www.realfood.co.il/
