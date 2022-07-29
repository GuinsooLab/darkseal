.DEFAULT_GOAL := help
PY_SOURCE ?= ingestion/src

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[35m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: env38
env38:
	python3.8 -m venv env38

.PHONY: clean_env37
clean_env37:
	rm -rf env38

.PHONY: install
install:  ## Install the ingestion module to the current environment
	python -m pip install ingestion/

.PHONY: install_apis
install_apis:  ## Install the REST APIs module to the current environment
	python -m pip install openmetadata-airflow-apis/

.PHONY: install_test
install_test:  ## Install the ingestion module with test dependencies
	python -m pip install "ingestion[test]/"

.PHONY: install_dev
install_dev:  ## Install the ingestion module with dev dependencies
	python -m pip install "ingestion[dev]/"

.PHONY: install_all
install_all:  ## Install the ingestion module with all dependencies
	python -m pip install "ingestion[all]/"

.PHONY: precommit_install
precommit_install:  ## Install the project's precommit hooks from .pre-commit-config.yaml
	@echo "Installing pre-commit hooks"
	@echo "Make sure to first run install_test first"
	pre-commit install

.PHONY: lint
lint: ## Run pylint on the Python sources to analyze the codebase
	find $(PY_SOURCE) -path $(PY_SOURCE)/metadata/generated -prune -false -o -type f -name "*.py" | xargs pylint --ignore-paths=$(PY_SOURCE)/metadata_server/

.PHONY: py_format
py_format:  ## Run black and isort to format the Python codebase
	pycln ingestion/ openmetadata-airflow-apis/ --extend-exclude $(PY_SOURCE)/metadata/generated
	isort ingestion/ openmetadata-airflow-apis/ --skip $(PY_SOURCE)/metadata/generated --skip ingestion/env --skip ingestion/build --skip openmetadata-airflow-apis/build --profile black --multi-line 3
	black ingestion/ openmetadata-airflow-apis/ --extend-exclude $(PY_SOURCE)/metadata/generated

.PHONY: py_format_check
py_format_check:  ## Check if Python sources are correctly formatted
	pycln ingestion/ openmetadata-airflow-apis/ --diff --extend-exclude $(PY_SOURCE)/metadata/generated
	isort --check-only ingestion/ openmetadata-airflow-apis/ --skip $(PY_SOURCE)/metadata/generated --skip ingestion/build --profile black --multi-line 3
	black --check --diff ingestion/ openmetadata-airflow-apis/  --extend-exclude $(PY_SOURCE)/metadata/generated

## Ingestion models generation
.PHONY: generate
generate:  ## Generate the pydantic models from the JSON Schemas to the ingestion module
	@echo "Running Datamodel Code Generator"
	@echo "Make sure to first run the install_dev recipe"
	datamodel-codegen --input catalog-rest-service/src/main/resources/json --input-file-type jsonschema --output ingestion/src/metadata/generated --set-default-enum-member
	$(MAKE) py_antlr
	$(MAKE) install

## Ingestion tests & QA
.PHONY: run_ometa_integration_tests
run_ometa_integration_tests:  ## Run Python integration tests
	coverage run -a --branch -m pytest -c ingestion/setup.cfg --junitxml=ingestion/junit/test-results-integration.xml ingestion/tests/integration/ometa ingestion/tests/integration/stage ingestion/tests/integration/orm_profiler

.PHONY: unit_ingestion
unit_ingestion:  ## Run Python unit tests
	coverage run -a --branch -m pytest -c ingestion/setup.cfg --junitxml=ingestion/junit/test-results-unit.xml --ignore=ingestion/tests/unit/source ingestion/tests/unit

.PHONY: coverage
coverage:  ## Run all Python tests and generate the coverage report
	coverage erase
	$(MAKE) unit_ingestion
	$(MAKE) run_ometa_integration_tests
	coverage xml -o ingestion/coverage.xml
	cat ingestion/coverage.xml

.PHONY: sonar_ingestion
sonar_ingestion:  ## Run the Sonar analysis based on the tests results and push it to SonarCloud
	docker run \
		--rm \
		-e SONAR_HOST_URL="https://sonarcloud.io" \
		-e SONAR_LOGIN=$(token) \
		-v ${PWD}:/usr/src \
		sonarsource/sonar-scanner-cli \
		-Dproject.settings=ingestion/sonar-project.properties

## Ingestion publish
.PHONY: publish
publish:  ## Publish the ingestion module to PyPI
	$(MAKE) install_dev generate
	cd ingestion; \
	  python setup.py install sdist bdist_wheel; \
	  twine check dist/*; \
	  twine upload dist/*

## Docker operators
.PHONY: build_docker_base
build_docker_base:  ## Build the base Docker image for the Ingestion Framework Sources
	$(MAKE) install_dev generate
	docker build -f ingestion/connectors/Dockerfile-base ingestion/ -t openmetadata/ingestion-connector-base

.PHONY: build_docker_connectors
build_docker_connectors:  ## Build all Ingestion Framework Sources Images to be used as Docker Operators in Airflow
	@echo "Building Docker connectors. Make sure to run build_docker_base first"
	python ingestion/connectors/docker-cli.py build

.PHONY: push_docker_connectors
push_docker_connectors:  ## Push all Sources Docker Images to DockerHub
	@echo "Pushing Docker connectors. Make sure to run build_docker_connectors first"
	python ingestion/connectors/docker-cli.py push

## Yarn
.PHONY: yarn_install_cache
yarn_install_cache:  ## Use Yarn to install UI dependencies
	cd openmetadata-ui/src/main/resources/ui && yarn install --frozen-lockfile

.PHONY: yarn_start_dev_ui
yarn_start_dev_ui:  ## Run the UI locally with Yarn
	cd openmetadata-ui/src/main/resources/ui && yarn start

## Ingestion Core
.PHONY: core_install_dev
core_install_dev:  ## Prepare a venv for the ingestion-core module
	cd ingestion-core; \
		rm -rf venv; \
		python3 -m venv venv; \
		. venv/bin/activate; \
		python3 -m pip install ".[dev]"

.PHONY: core_clean
core_clean:  ## Clean the ingestion-core generated files
	rm -rf ingestion-core/src/metadata/generated
	rm -rf ingestion-core/build
	rm -rf ingestion-core/dist

.PHONY: core_generate
core_generate:  ## Generate the pydantic models from the JSON Schemas to the ingestion-core module
	$(MAKE) core_install_dev
	mkdir -p ingestion-core/src/metadata/generated; \
	. ingestion-core/venv/bin/activate; \
	datamodel-codegen --input catalog-rest-service/src/main/resources/json  --input-file-type jsonschema --output ingestion-core/src/metadata/generated
	$(MAKE) core_py_antlr

.PHONY: core_bump_version_dev
core_bump_version_dev:  ## Bump a `dev` version to the ingestion-core module. To be used when schemas are updated
	$(MAKE) core_install_dev
	cd ingestion-core; \
		. venv/bin/activate; \
		python -m incremental.update metadata --dev

.PHONY: core_publish
core_publish:  ## Install, generate and publish the ingestion-core module to Test PyPI
	$(MAKE) core_clean core_generate
	cd ingestion-core; \
		. venv/bin/activate; \
		python setup.py install sdist bdist_wheel; \
		twine check dist/*; \
		twine upload -r testpypi dist/*

.PHONY: core_py_antlr
core_py_antlr:  ## Generate the Python core code for parsing FQNs under ingestion-core
	antlr4 -Dlanguage=Python3 -o ingestion-core/src/metadata/generated/antlr ${PWD}/catalog-rest-service/src/main/antlr4/org/openmetadata/catalog/Fqn.g4

.PHONY: py_antlr
py_antlr:  ## Generate the Python code for parsing FQNs
	antlr4 -Dlanguage=Python3 -o ingestion/src/metadata/generated/antlr ${PWD}/catalog-rest-service/src/main/antlr4/org/openmetadata/catalog/Fqn.g4

.PHONY: install_antlr_cli
install_antlr_cli:  ## Install antlr CLI locally
	echo '#!/usr/bin/java -jar' > /usr/local/bin/antlr4
	curl https://www.antlr.org/download/antlr-4.9.2-complete.jar >> /usr/local/bin/antlr4
	chmod 755 /usr/local/bin/antlr4


.PHONY: docker-docs
docker-docs:  ## Runs the OM docs in docker passing openmetadata-docs as volume for content and images
	docker run --name openmetadata-docs -p 3000:3000 -v ${PWD}/openmetadata-docs/content:/docs/content/ -v ${PWD}/openmetadata-docs/images:/docs/public/images -v ${PWD}/openmetadata-docs/ingestion:/docs/public/ingestion openmetadata/docs:latest

.PHONY: docker-docs
docker-docs-local:  ## Runs the OM docs in docker with a local image
	docker run --name openmetadata-docs -p 3000:3000 -v ${PWD}/openmetadata-docs/content:/docs/content/ -v ${PWD}/openmetadata-docs/images:/docs/public/images -v ${PWD}/openmetadata-docs/ingestion:/docs/public/ingestion openmetadata-docs:local
