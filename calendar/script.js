import { generate_year } from "./generate.js"
import markdownIt from "./markdownIt/markdown-it.js";
import page from "../scripts/page.js";

let slug
let set_slug = (s) => {
	if (s != slug) {
		slug = s
		year = generate_year(2025)
		update_channel()
	}
}

let cmd

const init = () => {
	page("/", () =>  slug = "" );
	page("/:slug", (ctx) => {
		set_slug(ctx.params.slug)
	});

	page("/:slug/:cmd", (ctx) => {
		set_slug(ctx.params.slug)
		let cmd = (ctx.params.cmd)
		console.log("slug", slug)
		console.log("cmd", cmd)
	});

	page("/:slug/:cmd/:data", (ctx) => {
		set_slug(ctx.params.slug)
		let cmd = (ctx.params.cmd)
		let data = (ctx.params.data)
		console.log("cmd", cmd)
		console.log("data", data)

		if (cmd == "month") {
			month = data
			update_calendar()
		}

		if (cmd == "event") {
			let target  = document.getElementById(data)
			if (target) target.scrollIntoView({ behavior: "smooth" })
		}

	});

	page({ hashbang: true });
};

window.addEventListener('hashchange', function() {
	page("/"+window.location.href.split("#!/").pop())
});

let year = generate_year(2025)
let month = 7

const contains_month = (week, month_num) => {
  let contains = false;


  week.forEach((day) => {
    if (day.month_number == month_num) {
      contains = true;
    }
  });


  return contains;
};

let token = localStorage.getItem("token")
if (!token) window.location = "../index.html"

// are.na
let host = "http://localhost:3000/api/";
// let host = "https://api.are.na/v2/";

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

let feed = document.getElementById("feed")
let event = (e) => `<a href="/calendar/#!/${slug}/event/${e.id}"><p>${e.content.slice(0,8)}</p></a>`
let update_calendar = () => {
	let day_class = (day) => day.day_name.toLowerCase().substring(0, 3);
	let html = `
		<div class="week">
			<a href="/calendar/#!/${slug}/month/${parseInt(month)-1}"><button>prev</button></a>
			${months[month]}
			<a href="/calendar/#!/${slug}/month/${parseInt(month)+1}"><button>next</button></a>
		</div>
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
	year.forEach((week) => {
		if (contains_month(week, month)) {
			html += `<div class="week">`

			week.forEach((day) =>
				html += `
				<div class="day ${day_class(day)}">
					${day.date}
					${day.blocks.map(event).join("")}
				</div>`)

			html += `</div>`
		}
	})


	calendar.innerHTML = html
}

let update_channel = () => {
	get_channel(slug, token).then((channel) => {
		let html = ""
		channel.contents.forEach((block) => {
			if (block.class=="Text") html +='<div class="day">' + MD(block.content).join("") + "</div>"
		})

		feed.innerHTML = html
		update_calendar()
	})
}

if (slug) update_channel()

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
				if (debug_print) {console.log("---\nxxx\ntag:\nxxx\nx----\n", item.tag)}
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
		if (word.toLowerCase() == month.toLowerCase()) {
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
			let date = new Date(buff + " " + word + " 2025")
			let id = Math.floor(Math.random() * 1000000)
			year.forEach((week) => {
				week.forEach((day) => {
					if (day.js_date.toDateString() == date.toDateString()){
						day.blocks.push({id: "date-"+id, content: words.join(" ")})
					}
				})
			})

			if (!isNaN(it)) {
				dt = buff;
				skip = true
			}

			return `<span class='month-word' id=${"date-"+id}>` + word + " " + dt + "</span>"
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

init()
