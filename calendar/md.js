import markdownIt from "./markdownIt/markdown-it.js";

// ********************************
// SECTION : MARKDOWN RENDERING
// ********************************
let md = new markdownIt('commonmark')//.use(makrdownItMark);

let attrs = (item) => {
	let attrs = item.attrs;
	if (!attrs) return "";
	return Object.fromEntries(attrs);
};

const link_is_block = (link) => {
	return link.includes("are.na/block");
};

const extract_block_id = (link) => {
	return link.split("/").pop();
};

function eat(tree) {
	let ret = [];

	if (!tree) return "";

	while (tree.length > 0) {
		let item = tree.shift();
		if (item.nesting === 1) {
			let at = attrs(item);
			let ignore = false;
			let entries = Object.entries
			let at_string =
				// convert attribute (in object form)
				// to an html stringified attribute form
				entries(at)
					.map(([key, value]) => `${key} = "${value}"`)
					.join(" ");

			if (!ignore) {
				let children = eat(tree);
				children = Array.isArray(children) ? children.join("") : children;

				if (debug_print) {
					console.log("---\nxxx\ntag:\nxxx\nx----\n", item.tag)
				}

				ret.push(`<${item.tag} ${at_string}> ${children} </${item.tag}>`);
			}
		}

		if (item.nesting === 0) {
			if (!item.children || item.children.length === 0) {
				let p = item.type === "softbreak"
					? "<br></br>"
					: item.type === "fence"
						? `<xmp>${item.content}</xmp>`
						: format_content(item.content);
				ret.push(p);
			} else {
				if (debug_print) {
					// console.log("---\ntype:\n----\n", item.type)
					//console.log("---\ncontent:\n----\n", item.content)
				}
				let children = eat(item.children);
				children = Array.isArray(children) ? children.join("") : children;
				ret.push(children);
			}
		}

		if (item.nesting === -1) break;
	}

	return ret;
}

let months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const match_month = (word) => {
	let matched = false
	months.forEach((month) => {
		if (word.toLowerCase() == month.toLowerCase()){
			console.log("matched", word)
			matched = true
		}
	})
	return matched
}

const format_content = (content) => {
	let words = content.split(" ")
	let last = (i) => words[i - 1]
	let next = (i) => words[i + 1]
	let skip = false

	return words.map((word, i) => {
		if (skip) {
			skip = false
			return ""
		}
		if (match_month(word)) {
			let n = next(i)
			let ii = 0
			let buff = ''

			while (ii < n.length){
				let it = parseInt(n[ii])
				if (isNaN(it)) break;
				else buff += it.toString()
				ii++
			}

			let dt = ""

			let it = parseInt(buff)
			if (!isNaN(it)) {
				dt = buff;
				skip = true
			}
			return "<span clas='month-word'>" + word + " "+ dt+ "</span>"
		}
		else return word
	}).join(" ")

}

let safe_parse = (content) => {
	try {
		return md.parse(content, { html: true });
	} catch (e) {
		return undefined;
	}
};

let debug_print = false
export const MD = (content) => {

	// if (content.includes('# How templater work')) debug_print = true
	// else debug_print = false

	let tree, body;
	tree = safe_parse(content);

	// if (debug_print) {
	// 	fs.writeFileSync("templater.md", content)
	// 	let templater = fs.readFileSync("./templater.md", { encoding: "utf-8" })
	// 	tree = safe_parse(templater);
	// 	console.log(tree)
	// }

	// else {
	// }

	if (tree) body = eat(tree);
	else body = content;

	if (debug_print) {
		//console.log('body', body)
		//	console.log("content:", content)
	}

	return body;
};
