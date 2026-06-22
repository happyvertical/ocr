[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OAuth2Config

# Interface: OAuth2Config

Defined in: [src/node/litellm.ts:83](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L83)

OAuth2 configuration for client credentials flow

## Properties

### tokenUrl

> **tokenUrl**: `string`

Defined in: [src/node/litellm.ts:85](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L85)

Token endpoint URL (e.g., https://auth.example.com/realms/myrealm/protocol/openid-connect/token)

***

### clientId

> **clientId**: `string`

Defined in: [src/node/litellm.ts:87](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L87)

OAuth2 client ID

***

### clientSecret

> **clientSecret**: `string`

Defined in: [src/node/litellm.ts:89](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L89)

OAuth2 client secret

***

### scopes?

> `optional` **scopes?**: `string`[]

Defined in: [src/node/litellm.ts:91](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L91)

Optional additional scopes
