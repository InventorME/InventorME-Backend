import json
import base64
import boto3
s3 = boto3.client("s3")

def lambda_handler(event, context):
	try:
		method = event['httpMethod']
		bucket = 'inventorme'
		params = event["queryStringParameters"]
		query = params["url"]
		if(method == "GET"):
			response = s3.get_object(Bucket = bucket, Key=query)
			img = response['Body'].read()
			myObj = [base64.b64encode(img)]
			returnJson = str(myObj[0])
			returnJson = returnJson.replace("b'","")
			returnJson = returnJson.replace("'","")
			return {
	    		'statusCode': 200,
	    		'body': returnJson
			}
		elif(method == "POST"):
			getFileContent = event["body"]
			decodeContent = base64.b64decode(getFileContent)
			# decodeContent = event["body"]
			s3Upload = s3.put_object(Bucket = bucket, Key = query, Body = decodeContent)
			# json.dumps(event)
			return {
	    		'statusCode': 200,
	    		'body': json.dumps(event)
			}
		else:
			return{
				'statusCode': 500,
				"headers": {
					"Content-Type": "application/json"
				},
				'body': 'missing http method type'
			}
	except:
		return{
				'statusCode': 500,
				'headers': {
					"Content-Type": "application/json"
				},
				'body': "Error executing file IO"
			}
