require('dotenv-flow').config()
process.env.PUPPETEER_PRODUCT = 'firefox'
const markdownIt = require('markdown-it')
const htmlPdf = require('pdf-puppeteer')
const handlebars = require('handlebars')
const fs = require('fs')
const sass = require('node-sass')
const path = require('path')
const prettier = require('prettier')

const converter = markdownIt({
	html: true,
	xhtmlOut: true,
	typographer: true,
})

const templateSource = fs.readFileSync('template/template.html').toString()
const template = handlebars.compile(templateSource)

const mdToPdf = (inPath) => {
	const md = fs.readFileSync(inPath).toString()
	console.log('Converting Markdown to HTML...')
	const bodyHtml = converter.render(md)
	console.log('Converting SASS...')
	const css = sass
		.renderSync({
			file: 'template/styles.scss',
		})
		.css.toString()
	console.log('Populating template...')
	const telFormatted = [
		process.env.TEL.substr(0, 3),
		process.env.TEL.substr(3, 3),
		process.env.TEL.substr(6),
	].join('.')
	let html = template({
		body: bodyHtml,
		tel: process.env.TEL,
		telFormatted,
		addr: process.env.ADDR,
		css,
	})
	const filename = path.basename(inPath).split('.')[0]
	console.log('Formatting with prettier...')
	html = prettier.format(html, { parser: 'html', useTabs: true })
	console.log('Exporting to HTML...')
	fs.writeFileSync(`exports/${filename}.html`, html)
	console.log('Exporting to PDF...')
	htmlPdf(
		html,
		(data) => {
			fs.writeFileSync(`exports/${filename}.pdf`, data)
		},
		{},
		{ product: 'firefox' }
	)
}

fs.readdir('./source-files/', (err, files) => {
	files.forEach((file) => {
		console.log('======== ' + file)
		mdToPdf('./source-files/' + file)
	})
	console.log('Done, all files converted')
})
