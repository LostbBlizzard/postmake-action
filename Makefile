build:
	npm install @actions/core

	npm install @actions/github

	npm install tar

	npm install adm-zip

	ncc build src/index.js -o dist

