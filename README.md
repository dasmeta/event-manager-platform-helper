
## Installation
`yarn add @dasmeta/event-manager-platform-helper`

## Configuration
### Environment variables

```
DEPLOYER_PLATFORM=gcf

MONGODB_EVENT_USERNAME=username
MONGODB_EVENT_PASSWORD=password
MONGODB_EVENT_HOST=localhost
MONGODB_EVENT_PORT=27017
MONGODB_EVENT_DB=event
```
## Usage
### Provide environment variable
```javascript
// example1.js

const platformHelper = require('@dasmeta/event-manager-platform-helper')

const doThing = () => {
    console.log('function executed.')
}

const handler = platformHelper.wrapHandler(doThing)
```
```shell
DEPLOYER_PLATFORM=gcf node example1.js
```

### Calling by parameter

```javascript
// example2.js

const platformHelper = require('@dasmeta/event-manager-platform-helper')

const doThing = () => {
    console.log('function executed.')
}

const handler = platformHelper.wrapHandler(doThing, 'gcf')
```
```shell
node example2.js
```

## Development
## Adding new platform adapter
- Copy `src/adapter/platforms/fission.js` to new adapter file eg. `src/adapter/platforms/awsLambda.js`
- Implement the exported functions according to lambda specifications


## Simple function call test
```javascript
const platformHelper = require('@dasmeta/event-manager-platform-helper')

async function test(platform) {
    const log = (...all) => {
        console.log(`${platform}\n`, ...all, "\n");
    }
    const mockHandler = (data, context) => {
        log('function executed.\n', {data, context})
    }

    const wrappedHandler = platformHelper.wrapHandler(mockHandler, platform)

    const event = {
        eventId: 123,
        traceId: 'aabbccddee',
        data: {application: "data"},
        dataSource: "something",
        subscription: ""
    }

    const payloads = {
        gcf: [
            { data: Buffer.from(JSON.stringify(event)).toString('base64')},
            {
                resource: {
                    name: 'some-namespace/some-name'
                }
            }
        ],
        fission: [{
            request: {
                get: (key) => {
                    log(`must get '${key}'`);
                    return `${key} data`
                },
                body: event
            }
        }]
    }

    const rs = await wrappedHandler(...payloads[platform])
    log("rs", rs)
}

test('gcf');
test('fission');

```