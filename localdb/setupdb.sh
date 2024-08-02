export DYNAMODB_LOCAL_URL=${1:-http://localhost:8000}
export AWS_DEFAULT_REGION=eu-central-1
export AWS_ACCESS_KEY_ID='DUMMY'
export AWS_SECRET_ACCESS_KEY='DUMMY'

# disable pagination, else aws cli will call less every time in an interactive shell
export AWS_PAGER=""

aws dynamodb delete-table --table-name INIP-TEST-photoassignments --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-photoassignments --attribute-definitions AttributeName=consumptionTheme,AttributeType=N --key-schema AttributeName=consumptionTheme,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-consumptionthememapping --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-consumptionthememapping --attribute-definitions AttributeName=consumptionTheme,AttributeType=N --key-schema AttributeName=consumptionTheme,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-sectormapping --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-sectormapping --attribute-definitions AttributeName=sector,AttributeType=N --key-schema AttributeName=sector,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-consumptionfieldmapping --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-consumptionfieldmapping --attribute-definitions AttributeName=consumptionField,AttributeType=N --key-schema AttributeName=consumptionField,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-sizemappings --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-sizemappings --attribute-definitions AttributeName=_id,AttributeType=S --key-schema AttributeName=_id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-brands --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-brands --attribute-definitions AttributeName=brand,AttributeType=S --key-schema AttributeName=brand,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-photostudiosupdated --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-photostudiosupdated --attribute-definitions AttributeName=photostudio,AttributeType=S --key-schema AttributeName=photostudio,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-expiredimages --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-expiredimages --attribute-definitions AttributeName=consumptionTheme,AttributeType=N AttributeName=gtin,AttributeType=S --key-schema AttributeName=consumptionTheme,KeyType=HASH AttributeName=gtin,KeyType=RANGE --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-state --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-state --attribute-definitions AttributeName=identifier,AttributeType=S AttributeName=timestamp,AttributeType=S --key-schema AttributeName=identifier,KeyType=HASH AttributeName=timestamp,KeyType=RANGE --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-korexorderexportmapping --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-korexorderexportmapping --attribute-definitions AttributeName=orderExportGtin,AttributeType=S --key-schema AttributeName=orderExportGtin,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-fmarequestmapping --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-fmarequestmapping --attribute-definitions AttributeName=fmaRequestId,AttributeType=S --key-schema AttributeName=fmaRequestId,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-gtinblocks --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-gtinblocks --attribute-definitions AttributeName=gtin,AttributeType=S AttributeName=blockedUntil,AttributeType=S --key-schema AttributeName=gtin,KeyType=HASH AttributeName=blockedUntil,KeyType=RANGE --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-opentasksnew --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-opentasksnew --attribute-definitions AttributeName=_id,AttributeType=S --key-schema AttributeName=_id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-limits --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-limits --attribute-definitions AttributeName=day,AttributeType=S --key-schema AttributeName=day,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb delete-table --table-name INIP-TEST-latest-state --endpoint-url ${DYNAMODB_LOCAL_URL} || true
aws dynamodb create-table --table-name INIP-TEST-latest-state --attribute-definitions AttributeName=identifier,AttributeType=S --key-schema AttributeName=identifier,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url ${DYNAMODB_LOCAL_URL} || true

# Create indexes for INIP-TEST-sizemappings
aws dynamodb update-table \
    --table-name INIP-TEST-sizemappings \
    --attribute-definitions AttributeName=consumptionTheme,AttributeType=N AttributeName=brand,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_consumptionTheme_brand\",\"KeySchema\":[{\"AttributeName\":\"consumptionTheme\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"brand\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

# Create indexes for INIP-TEST-state
aws dynamodb update-table \
    --table-name INIP-TEST-state \
    --attribute-definitions AttributeName=status,AttributeType=S AttributeName=timestamp,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_status_timestamp\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-state \
    --attribute-definitions AttributeName=storeId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_storeId_status\",\"KeySchema\":[{\"AttributeName\":\"storeId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-state \
    --attribute-definitions AttributeName=fmaRequestId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_fmaRequestId_status\",\"KeySchema\":[{\"AttributeName\":\"fmaRequestId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-state \
    --attribute-definitions AttributeName=identifier,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_identifier_status\",\"KeySchema\":[{\"AttributeName\":\"identifier\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

# Create indexes for INIP-TEST-opentasksnew
aws dynamodb update-table \
    --table-name INIP-TEST-opentasksnew \
    --attribute-definitions AttributeName=type,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_type\",\"KeySchema\":[{\"AttributeName\":\"type\",\"KeyType\":\"HASH\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

# Create indexes for INIP-TEST-latest-state
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=destinationLocationId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_destinationLocationId_identifier\",\"KeySchema\":[{\"AttributeName\":\"destinationLocationId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"identifier\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=status,AttributeType=S AttributeName=timestamp,AttributeType=S\
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_status_timestamp\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=fmaRequestId,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_fmaRequestId\",\"KeySchema\":[{\"AttributeName\":\"fmaRequestId\",\"KeyType\":\"HASH\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=storeId,AttributeType=S AttributeName=status,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_storeId_status\",\"KeySchema\":[{\"AttributeName\":\"storeId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=destinationLocationId,AttributeType=S AttributeName=status,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_destinationLocationId_status\",\"KeySchema\":[{\"AttributeName\":\"destinationLocationId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=gtin,AttributeType=S AttributeName=status,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_gtin_status\",\"KeySchema\":[{\"AttributeName\":\"gtin\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

sleep 10
aws dynamodb update-table \
    --table-name INIP-TEST-latest-state \
    --attribute-definitions AttributeName=status,AttributeType=S AttributeName=procurementStartedAt,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"idx_status_procurementStartedAt\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"procurementStartedAt\",\"KeyType\":\"RANGE\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 10, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
    --endpoint-url ${DYNAMODB_LOCAL_URL} || true

aws dynamodb list-tables --endpoint-url ${DYNAMODB_LOCAL_URL} || true