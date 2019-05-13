const {
	createReadStream,
	stat
} = require('fs')
const {
	join
} = require('path')
const {
	pipe,
	map,
	prop,
	converge,
	curry,
	invoker,
	head,
	concat,
	lift
} = require('ramda')
const {
	log
} = require('./utils')

const NodeStream = require('../src/NodeStream')
const Future = require('../src/Future')
const csv = require('fast-csv')

// util
const runFuture = invoker(2, 'fork')

const LIST_FILE_PATH = `${__dirname}/files.txt`
const SRC_PATH = join(__dirname, '../src/')

// readFileStream :: path -> NodeStream
const readFileStream = NodeStream.streamify(createReadStream)

// filesSize :: path -> Future e Number 
const filesSize = pipe(
	Future.futurify(stat),
	map(prop('size')),
	map((fileSizeInBytes) => fileSizeInBytes / 1000000.0) // to MB
)

// fileFormat :: String -> Number -> { name: String, size: Number }
const fileFormat = curry((name, size) => ({
	name,
	size
}))

// fileSizeWithFormat :: path -> Future e { name, size}
const fileSizeWithFormat = converge(lift(fileFormat), [Future.of, filesSize])

// getFileSizes :: path -> NodeStream Future e Object
const getFileSizes = pipe(
	readFileStream,
	map(csv()),
	map(head),
	map(concat(SRC_PATH)),
	map(fileSizeWithFormat)
)

// program
getFileSizes(LIST_FILE_PATH)
	.subscribe(
		runFuture(log('future error:'), log('data:'))
	)