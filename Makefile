# Informations aboud Make with AWS: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html
# Some required stuff
.PHONY: build-RuntimeDependenciesLayer build-lambda-common

build-lambda-common:
	npm install
	rm -rf dist
	echo "{\"extends\": \"./tsconfig.json\", \"include\": [\"${HANDLER}\"] }" > tsconfig-only-handler.json
	npm run build -- --build tsconfig-only-handler.json
	cp -r dist "$(ARTIFACTS_DIR)/"

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" # to avoid rebuilding when changes aren't related to dependencies

# One line for each lambda-function to build
.PHONY: build-AskUser

# Api Stuff
.PHONY: build-ApiAllBrandsHandler


# One function (or however this is called in a Makefile) for each lambda-function
build-AskUser:
	$(MAKE) HANDLER=src/handlers/AskUser.ts build-lambda-common
