build:
	npm install @actions/core

	npm install tar

	npm install adm-zip

	ncc build src/index.js -o dist

