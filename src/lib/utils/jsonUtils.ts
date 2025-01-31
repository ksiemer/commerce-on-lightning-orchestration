/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { fs, Messages, SfdxError } from '@salesforce/core';
import { convertKabobToCamel } from './stringUtils';

Messages.importMessagesDirectory(__dirname);
const msgs = Messages.loadMessages('commerce-orchestration', 'commerce');
// TODO dont' disable this linting
/* eslint-disable */
/**
 * Takes in flags and a json file and adds the flag value to the json object
 * if and only if they aren't the default value (i'll take the json values unless a flag is passed to override it or no value is given in json)
 * also flags need to be kabob case and json prefers Camel (to not have to quote keys)
 *
 * @param flagsConfig SfdxCommand.flagsConfig
 * @param flags this.flags
 * @param jsonProperties this.devHubConfig from this.devHubConfig = await DevhubSetup.parseConfig(this.flags.configuration);
 */
export function overrideJsonWithFlags(flagsConfig, flags, jsonProperties) {
  Object.keys(flagsConfig).forEach((flag) => {
    const camelFlag = convertKabobToCamel(flag);
    if ((flags[flag] && flagsConfig[flag].default !== flags[flag]) || !jsonProperties[camelFlag])
      jsonProperties[camelFlag] = flags[flag];
  });
}

export function parseJSONConfigWithFlags(jsonFile, flagsConfig, flags): Promise<DevHubConfig> {
  if (jsonFile === 'devhub-configuration.json')
    try {
      console.log(msgs.getMessage('jsonUtils.parseConfigExample', jsonFile));
    } catch (err) {
      // console.log(err); // cannot read property isOutputEnabled of undefined?
    }
  if (!fs.existsSync(jsonFile)) throw new SfdxError(`Configuration file ${jsonFile} does not exist`);
  const jsonObj = Object.assign(
    new DevHubConfig(),
    JSON.parse(
      fs
        .readFileSync(jsonFile)
        .toString()
        .replace('$(whoami)', os.userInfo().username)
        .replace('$(hostname)', os.hostname())
    )
  );
  if (jsonObj.scratchOrgs && jsonObj.scratchOrgs.length <= flags['scratch-org-number'])
    throw new SfdxError(
      msgs.getMessage('jsonUtils.errorScratchOrgNumber', [
        `${flags['scratch-org-number']}`,
        `${jsonObj.scratchOrgs.length}`,
      ])
    );
  if (jsonObj.scratchOrgs && flags['scratch-org-number'] >= 0) {
    if (
      jsonObj.scratchOrgs[flags['scratch-org-number']].scratchOrgStoreName &&
      !jsonObj.scratchOrgs[flags['scratch-org-number']].storeName
    )
      // backwards compatibility
      jsonObj.scratchOrgs[flags['scratch-org-number']].storeName =
        jsonObj.scratchOrgs[flags['scratch-org-number']].scratchOrgStoreName;
    Object.keys(jsonObj.scratchOrgs[flags['scratch-org-number']]).forEach(
      (k) => (jsonObj[k] = jsonObj.scratchOrgs[flags['scratch-org-number']][k])
    );
    if (jsonObj.stores && flags['store-number'] >= 0) {
      if (jsonObj.stores.length <= flags['store-number'])
        throw new SfdxError(
          msgs.getMessage('jsonUtils.parseConfigExample', [`${flags['store-number']}`, `${jsonObj.stores.length}`])
        );
      Object.keys(jsonObj.stores[flags['store-number']]).forEach(
        (k) => (jsonObj[k] = jsonObj.stores[flags['store-number']][k])
      );
    }
  }
  Object.keys(jsonObj).forEach(
    (k) => (jsonObj[k] = typeof jsonObj[k] === 'string' ? jsonObj[k] : JSON.parse(JSON.stringify(jsonObj[k])))
  );
  overrideJsonWithFlags(flagsConfig, flags, jsonObj);
  return jsonObj;
}
export const replaceErrors = (key, value) => {
  if (value instanceof Error) {
    const error = {};
    Object.getOwnPropertyNames(value).forEach((propName) => {
      error[propName] = value[propName];
    });
    return error;
  }

  return value;
};
/* eslint-disable */
export class DevHubConfig {
  public storeType: string;
  public definitionfile: string;
  public type: string; // b2c or b2b
  public clientId: string;
  public useJwt: boolean;
  public apiVersion: string;
  public hubOrgAdminEmail: string;
  public hubOrgAdminUsername: string;
  public hubOrgAdminPassword: string;
  public hubOrgMyDomain: string;
  public hubOrgAlias: string;
  public instanceUrl: string;
  public productsFileCsv: string;
  public scratchOrgAlias: string;
  public scratchOrgAdminUsername: string;
  public scratchOrgBuyerUsername: string;
  public scratchOrgStoreName: string;
  public templateName: string;
  public buyerEmail: string;
  public buyerAlias = 'buyer';
  public communitySiteName: string;
  public communityExperienceBundleName: string;
  public communityNetworkName: string;
  public existingBuyerAuthentication: string;
  public isB2cLiteAccessPermNeeded: boolean;
  public scratchOrgs: ScratchOrgConfig[];
  public stores: Store[];
  public paymentAdapter: string;
  public storeName: string;
  public examplesConvert: string[];
  public sfdcLoginUrl: string;
  public configFile: string;
  public serverCert: string;
  public orgCreateDir: string;
  public showBrowser: boolean = false;
  public puppeteerBrowserPath: string;
}
export class ScratchOrgConfig {
  public scratchOrgAdminUsername: string;
  public scratchOrgBuyerUsername: string;
  public stores: Store[];
  public scratchOrgStoreName: string;
  public storeName: string;
}
export class Store {
  public storeName: string;
}

export class SfdxProject {
  public packageDirectories: Record<string, any>[] = [
    {
      path: 'force-app',
      default: true,
    },
  ];
  public namespace: string = '';
  public sfdcLoginUrl: string = 'http://localhost.internal.salesforce.com:6109';
  public sourceApiVersion: string = '52.0';
  public signupTargetLoginUrl: string;
}

export class Result<T> {
  public status: number;
  public name: string;
  public message: string;
  public exitCode: number;
  public commandName: string;
  public stack: string;
  public warnings: string[];
  // eslint-disable-next-line
  public result: T;
  public command: string;
  public orgId: string;

  public constructor(message = '') {
    this.message = message;
  }
}
export class ConnectAppResult {
  public fullName: string;
  public contactEmail: string;
  public description: string;
  public label: string;
  public oauthConfig: OauthConfig;
  public errors: Errors;
  public success: boolean = true;
}
export class Errors {
  public fields: string;
  public message: string;
  public statusCode: string;
}
export class OauthConfig {
  public callbackUrl: string;
  public consumerKey: string;
  public scopes: string[];
  public consumerSecret: string;
}
export class OrgListResult {
  public nonScratchOrgs: Org[] = [];
  public scratchOrgs: Org[] = [];
}
export class ImportResult {
  public Id: string;
}
export class Org {
  public username: string;
  public orgId: string;
  public accessToken: string;
  public instanceUrl: string;
  public loginUrl: string;
  public clientId: string;
  public userId: string;
  public instanceApiVersion: string;
  public instanceApiVersionLastRetrived: string;
  public isDevHub: boolean;
  public lastUsed: Date;
  public connectedStatus: string;
  public id: string;
  public alias: string;
  public constructor(username?) {
    if (username) this.username = username;
  }
}
export class UserDef {
  public Username: string;
  public LastName: string = 'CreatedInSfdx';
  public Email: string = 'youremail@example.com';
  public Alias: string = 'admin13';
  public TimeZoneSidKey = 'America/Denver';
  public LocaleSidKey = 'en_US';
  public EmailEncodingKey = 'UTF-8';
  public LanguageLocaleKey = 'en_US';
  public profileName = 'Buyer_User_Profile_From_QuickStart';
  public generatePassword: boolean = true;
}

export class BuyerUserDef {
  public username: string;
  public FirstName = 'Buyer';
  public LastName = 'CreatedViaQuickstart';
  public Email: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  set email(email) {
    this.Email = email;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  get email() {
    return this.Email;
  }
  public Alias: string;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  set alias(alias) {
    this.Alias = alias;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  get alias() {
    return this.Alias;
  }
  public TimeZoneSidKey = 'America/Denver';
  public LocaleSidKey = 'en_US';
  public EmailEncodingKey = 'UTF-8';
  public LanguageLocaleKey = 'en_US';
  public profileName = 'Buyer_User_Profile_From_QuickStart';
}

export class PatchConfig {
  public Patches: Patch[];
}
export class Patch {
  public reason: string;
  public patch: string;
  public location: string;
}

export class UserInfo {
  public id: string;
  public accessToken: string;
  public instanceUrl: string;
  public loginUrl: string;
  public orgId: string;
  public profileName: string;
  public username: string;
  public password: string;

  public constructor(instanceUrl?: string) {
    if (instanceUrl) this.instanceUrl = instanceUrl;
  }
}

export class StoreConfig {
  public isAvailableToGuests = false;
  public isProgressiveRenderingEnabled = false;
  public type = 'site';
  public authenticationType: string;
}
