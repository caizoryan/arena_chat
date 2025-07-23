import { generate_year } from "./generate.js"
import markdownIt from "./markdownIt/markdown-it.js";

let year = generate_year(2025)
let month = 6

const contains_month = (week, month_num) => {
  let contains = false;

  week.forEach((day) => {
    if (day.month_number === month_num) {
      contains = true;
    }
  });

  return contains;
};

let token = localStorage.getItem("token")
if (!token) window.location = "../index.html"
console.log(token)
// are.na
let host = "https://api.are.na/v2/";

// API functions
export const get_channel = async (slug, auth) => {
  console.log("get channel called", slug);
  return await fetch(host + `channels/${slug}?per=100`, {
    headers: {
      Authorization: `Bearer ${auth}`,
      cache: "no-store",
      "Cache-Control": "max-age=0, no-cache",
      referrerPolicy: "no-referrer",
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
			return data
      // let length = data.length;
      // if (length > data.page * data.per) {
      //   // calculate last page
      //   let last_page = Math.ceil(length / data.per);
      //   return join_and_send_channel_page(data, slug, last_page, auth);
      // } else return data;
    });
};

// let day_class = day.day_name.toLowerCase().substring(0, 3);
const calendar = document.getElementById("calendar")
calendar.innerHTML  += `
	<div class="week">
		<div class="week-title">Sun</div>
		<div class="week-title">Mon</div>
		<div class="week-title">Tue</div>
		<div class="week-title">Wed</div>
		<div class="week-title">Thu</div>
		<div class="week-title">Fri</div>
		<div class="week-title">Sat</div>
	</div>
`

let html = ''

year.forEach((week) => {
  let day_class = (day) => day.day_name.toLowerCase().substring(0, 3);
	if (contains_month(week, month)) {
		html += `<div class="week">`

		week.forEach((day) => html += `<div class="day ${day_class(day)}">${day.date}</div>`)

		html += `</div>`
	}
})

calendar.innerHTML += html

let feed = document.getElementById("feed")
let match_month = (w) => {
	if (w.toLowerCase().includes("september"))
	{
		console.log("founc")
		return true
}
	return false
}

get_channel("studio-notes-all", token).then((channel) => {
	console.log(channel)
	channel.contents.forEach((block) => {
		if (block.class=="Text"){
			feed.innerHTML+='<div class="day">' + MD(block.content).join("") + "</div>"
		}
	})


})


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
