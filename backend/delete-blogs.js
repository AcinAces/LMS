async function deleteAll() {
  const res = await fetch('http://127.0.0.1:1337/api/blogs?pagination[limit]=1000');
  const data = await res.json();
  const blogs = data.data || [];
  console.log('Found ' + blogs.length + ' blogs to delete.');
  
  for (const b of blogs) {
    await fetch('http://127.0.0.1:1337/api/blogs/' + b.documentId, {
      method: 'DELETE'
    });
    console.log('Deleted ' + b.documentId);
  }
  console.log('All blogs deleted.');
}
deleteAll().catch(console.error);
