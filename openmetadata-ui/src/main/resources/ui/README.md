# OpenMetadata UI

> This guide will help you run OpenMetadata UI locally in dev mode.

## Pre-requisites

Before proceeding, ensure that you have installed the node and yarn with the versions given below.

```
"node": ">=10.0.0",
"yarn": "^1.22.0"
```

Install [Node](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/).<br />

Install ANTLR using our recipes via

```shell
sudo make install_antlr_cli
```

Using the command below, spin up the server locally from the directory `openmetadata-dist/target/openmetadata-*-SNAPSHOT`

```shell
./bin/openmetadata-server-start.sh conf/openmetadata.yaml
```

> If you don't have distributions generated or don't see `target` directory inside the `openmetadata-dist` then follow [this](https://docs.open-metadata.org/developers/contribute/build-code-and-run-tests/openmetadata-server#create-a-distribution-packaging) guide to create a distribution.
>
> Since typescript is heavily used in the OpenMetadata project, we generate the typescript types and the interface from JSON schema. We use the `QuickType` tool to generate the typescript types and interfaces. You can view the complete instructions [here](https://docs.open-metadata.org/developers/contribute/build-code-and-run-tests/generate-typescript-types-from-json-schema).

## Steps to Run OpenMetadata UI

Once the node and yarn are installed in the system, you can perform the following steps to run OpenMetadata UI.

**Step 1**: Run the given command to install the required dependencies.

**Note**: It’s a one-time task to install dependencies. If there are any changes in the `package.json` file, the following steps will have to be performed again.

```shell
# installing dependencies
> make yarn_install_cache
```

**Step 2**: Start the UI locally

```shell
# starting the UI locally
> make yarn_start_dev_ui
```

**Step 3**: Visit [localhost:3000](http://localhost:3000/) to access the OpenMetadata UI.

## How to Add Language Support

To add support for a new language in our internationalization setup using `react-i18next` and `i18next`, please follow the steps below:

### Create a Language JSON File

First, create a new JSON file for the language you want to add in the `openmetadata-ui/src/main/resources/ui/src/locale/languages` directory.

For example, if you want to add support for the `French` language, you can create a file called `fr-fr.json` in the languages directory:

```shell
# Navigate to the ui/src/locale/languages directory
cd openmetadata-ui/src/main/resources/ui/src/locale/languages

# Create the French language file
touch fr-fr.json

```

### Sync the Language File with the Primary Language

Since we use `en-us` as our primary language, if you have added a new language file, you need to sync the newly added language file with the primary language. You can use the `i18n` script to achieve this.

```shell
yarn run i18n
```

### Update the `i18nextUtil.ts`

Now add the newly added language in `i18nextUtil.ts` , so that `i18next` can have the translation resource available.

```diff
import { InitOptions } from 'i18next';
import { map } from 'lodash';
import enUS from '../../locale/languages/en-us.json';
+ import frFR from '../../locale/languages/fr-fr.json';

export const getInitOptions = (): InitOptions => {
  return {
+   supportedLngs: ['en-US', 'fr-FR'],
    resources: {
      'en-US': { translation: enUS },
+     'fr-FR': { translation: frFR },
    },
    fallbackLng: ['en-US'],
```

### Test the language translation

To check the language translation functionality, please follow the steps outlined below:

1. Click on the language selection dropdown, and a list of available languages will appear.
2. Choose the language you wish to test, and the translation will be applied.

Please refer to the image below for assistance:

<img width="1440" alt="image" src="https://user-images.githubusercontent.com/59080942/222646947-7ec6422e-4669-4db1-92c1-c6aec596dfdd.png">
