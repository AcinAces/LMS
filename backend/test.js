async function check() {
  const url = 'http://127.0.0.1:1337/api/blogs?filters[topic][]=Data%20Structure%20and%20Algorithms&filters[isPublished][]=true';
  const res = await fetch(url);
  console.log(await res.text());
}
check();
