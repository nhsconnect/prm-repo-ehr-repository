IMAGE_NAME = deductions/ehr-repository
APP_NAME = ehr-repository

.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

all: build run-d ## Calls build and then run-d

build: ## Build the container
	docker build -t $(IMAGE_NAME) .

build-nc: ## Build the container without caching
	docker build --no-cache -t $(IMAGE_NAME) .

run-local:
	npm run start-local

run: ## Run container 
	docker run -it -p 3000:3000 --name=$(APP_NAME) ${IMAGE_NAME} 

run-d:
	docker run -d -p 3000:3000 --name=$(APP_NAME) ${IMAGE_NAME}

stop: ## Stop and remove a running container
	docker stop $(APP_NAME); docker rm $(APP_NAME)
