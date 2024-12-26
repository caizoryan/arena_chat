import { get_channel, add_block } from "./arena.js";
import page from "./scripts/page.js";

let slug = ""
let token = localStorage.getItem("token");
let input = document.getElementById("message");
let send = document.getElementById("send");
let me


const init = () => {
	page("/", () => { slug = ("") });
	page("/:slug", (ctx) => {
		slug = (ctx.params.slug)
		start_chat()
	});
	page({ hashbang: true });
};


input.onkeydown = (e) => {
	e.stopPropagation();
	e.stopImmediatePropagation();
	if (e.key === "Enter" && !e.shiftKey && e.altKey) {
		send.click();
	}

	if (e.key == "Escape") {
		input.blur();
	}
}

send.onclick = async () => {
	let content = input.value;
	if (content === "") return;
	let data = await add_block(slug, content, token)
	console.log(data);
	input.value = "";
	update_chat();
}


// check if got from redirect
if (!token) {
	let params = new URL(document.location.toString()).searchParams;
	token = params.get("token");
	if (token) localStorage.setItem("token", token);
}

if (token) {
	check_me()
	// if (window) page("/" + slug)
	start_chat()
}

else {
	// // localhost 
	// if (window.location.href.includes("localhost")) {
	// 	window.location = "https://dev.are.na/oauth/authorize?client_id=RHnX4MgnrTomdvNAdr6o05NrrEIoargy13pZtH-Vw10&redirect_uri=https%3A%2F%2Fcaizoryan-httpsrequestforoauthtoken.web.val.run&response_type=code&scope="
	// }

	// production
	window.location = "https://dev.are.na/oauth/authorize?client_id=CitL7Li-mdYNtuogTS9jsVHOXbXyZKHZFl9wrYimof4&redirect_uri=https%3A%2F%2Fcaizoryan-arenachat.web.val.run&response_type=code&scope="
}


function start_chat() {
	update_chat();
}

function check_me() {
	fetch("https://api.are.na/v2/me", {
		method: "GET",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then((res) => res.json()).then((data) => {
		console.log(data);
		me = data
	})
}
Number.prototype.zeroPad = function() {
	return ('0' + this).slice(-2);
};

function update_chat() {
	let chat = document.querySelector("#chat");
	if (slug === "") {
		chat.innerHTML = `
			<div class="channel-select">
				<p>Enter Channel Link</p>
			</div>`;

		let slug_input = document.createElement("input");
		slug_input.placeholder = "Channel Link/Slug";
		slug_input.type = "text";
		slug_input.onkeydown = (e) => {
			if (e.key === "Enter") {
				// check if it is a link
				if (slug_input.value.includes("are.na")) {
					let split = slug_input.value.split("/")
					let slug = split[split.length - 1]
					page("/" + slug)
				}
				else page("/" + slug_input.value)
				document.querySelector(".channel-select").remove();
			}
		}



		document.querySelector(".channel-select").appendChild(slug_input);

		return
	}
	else {
		chat.innerHTML += "Loading...";

		get_channel(slug, token).then((data) => {
			chat.innerHTML = "";

			let last_date
			if (data?.contents?.length === 0) chat.innerHTML = "No messages yet";
			else data?.contents?.forEach((block) => {
				if (!last_date) last_date = new Date(block.connected_at)
				let time = new Date(block.connected_at)
				let seconds = time.getSeconds().zeroPad()
				let minutes = time.getMinutes().zeroPad()
				let hours = time.getHours().zeroPad()
				let ampm = hours >= 12 ? 'pm' : 'am';

				let distance = new Date(block.connected_at) - last_date

				if (distance > 1000 * 60 * 60 * 24) {
					let date = new Date(block.connected_at)
					chat.innerHTML += `<div class="date">${date.toDateString()}</div>`;
				}
				else {
					let diff_percent = distance / (1000 * 60 * 60 * 24)
					chat.innerHTML += `<div class="spacer" style="height:${diff_percent * 100}vh"></div>`;
				}

				last_date = new Date(block.connected_at)

				let class_name = block.user.id === me?.id ? "me" : ""
				class_name += block.class === "Media" ? " media" : ""
				if (block.class == "Text") chat.innerHTML += `<div class="block ${class_name}" id="${block.id}">${block.content_html}<br></br><span class="user">${block.user.first_name}</span><span class="time">((${hours}:${minutes})) ${ampm}</span> </div>`;
				if (block.class == "Image") chat.innerHTML += `<div class="block ${class_name}" id="${block.id}"><img src="${block?.image?.display?.url}"></div>`;
				if (block.class == "Link") chat.innerHTML += `<a href=${block.source.url}><div class="block ${class_name}" id="${block.id}"><img src="${block?.image?.display?.url}"></div></a>`;

				if (block.class == "Media" && block.embed) chat.innerHTML += `<div class="block ${class_name}" id="${block.id}">${block.embed.html}</div>`;
				else if (block.class == "Media") chat.innerHTML += `<div class="block ${class_name}" id="${block.id}"><img src="${block.image.display.url}"></div>`;
				chat.scrollTop = chat.scrollHeight;
			})
		})
	}


}


window.onload = () => {
	init();
	page("/" + slug)

	window.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && e.metaKey) {
			input.focus();
		}
	})
}
