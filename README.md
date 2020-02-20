# Cycle Manager Aragon App

Cycle Manager App used to define the current cycle in the StakeDao.

## Local Deployment

Install dependencies:
```
$ npm install
```
May require `npm install node-gyp` first

### Test
```
$ npm run test
```

### App Deployment
In a separate terminal start the devchain:
```
$ npx aragon devchain
```
In a separate terminal start the client (the web portion of the app):
```
$ npm run start:app
```
In a separate terminal deploy the DAO with:
```
$ npm run start:http:template
```