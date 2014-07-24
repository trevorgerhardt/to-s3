
# toS3

Push a folder to S3.

## Installation

```bash
$ npm install toS3 -g
```

## Requirements

Your AWS credentials must be accessible via the environment variables `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`.

## Usage

```bash
$ toS3 /directory bucketname
```

Directory gets passed to `path.resolve`. Bucketname must be valid.

That is all.

<3
