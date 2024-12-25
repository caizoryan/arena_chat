// are.na
let host = "https://api.are.na/v2/";

// API functions
export const get_channel = async (slug, auth) => {
  console.log("get channel called", slug);
  return await fetch(host + `channels/${slug}?per=200&force=true`, {
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
      return data;
    });
};

export const get_block = async (id) => {
  return await fetch(host + "blocks/" + id, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "GET",
  }).then((res) => res.json());
};

export const add_block_with_title = async (slug, title, content, auth) => {
  return await fetch(host + "channels/" + slug + "/blocks", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "POST",
    body: JSON.stringify({
      content: content,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      let block_id = data.id;
      // TODO: better way to do this
      if (title !== "") return update_block(block_id, { title: title }, slug);
      else return data
    });
};


export const add_block = async (slug, content, auth) => {
  return await fetch(host + "channels/" + slug + "/blocks", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "POST",
    body: JSON.stringify({
      content: content,
    }),
  })
    .then((response) => response.json())
};

export const add_block_multiple = (slugs, title, content) => {
  let first_slug = slugs.shift();
  fetch(host + "channels/" + first_slug + "/blocks", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "POST",
    body: JSON.stringify({
      content: content,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      let block_id = data.id;

      // TODO: better way to do this
      if (title !== "") update_block(block_id, { title: title }, first_slug);

      console.log("to add " + block_id + " to " + slugs);

      slugs.forEach((slug) => {
        let x = connect_block(slug, block_id);
        console.log(x);
      });
    });
};

export const update_block = (block_id, body, slug, fuck = false) => {
  fetch(host + `blocks/${block_id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "PUT",
    body: JSON.stringify(body),
  }).then((res) => {
    if (fuck) { fuck_refresh(slug) }
    return res
  });
};

export const connect_block = async (slug, id) => {
  return await fetch(host + "channels/" + slug + "/connections", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "POST",
    body: '{"connectable_id":"' + id + '","connectable_type":"Block"}',
  }).then((res) => {
    let r = res.json();
    return r;
  });
};

export const move_connection = (cur_slug, new_slug, block_id) => {
  connect_block(new_slug, block_id).then(() => {
    disconnect_block(cur_slug, block_id);
  });
};

export const disconnect_block = (slug, id) => {
  fetch(host + "channels/" + slug + "/blocks/" + id, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "DELETE",
  }).then((res) => {
    console.log(res)
  });
};

export const fuck_refresh = (slug) => {
  fetch(host + "channels/" + slug + "/blocks", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    method: "POST",
    body: JSON.stringify({
      content: "temp",
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      let block_id = data.id;
      disconnect_block(slug, block_id);
    });
};

export const get_comments = async (block_id) => {
  let comments = await fetch(host + `blocks/${block_id}/comments`, {
    headers: {
      Authorization: `Bearer ${auth}`,
      cache: "no-store",
      "Cache-Control": "max-age=0, no-cache",
      referrerPolicy: "no-referrer",
    },
  }).then((response) => response.json());

  return comments;
};
