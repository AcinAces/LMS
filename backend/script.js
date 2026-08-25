require('dotenv').config();
const {Client}=require('pg');
const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
c.connect().then(async()=>{
  const a=['api::quiz-question.quiz-question.create','api::mcq-option.mcq-option.create'];
  const r=await c.query('SELECT id FROM up_roles WHERE type IN (\'admin\',\'content_manager\',\'instructor\')');
  for(let x of a){
    let p=await c.query('SELECT id FROM up_permissions WHERE action=\'' + x + '\'');
    let pid;
    if(p.rows.length===0){
      let i=await c.query('INSERT INTO up_permissions (action, created_at, updated_at) VALUES (\'' + x + '\', NOW(), NOW()) RETURNING id');
      pid=i.rows[0].id;
    }else{
      pid=p.rows[0].id;
    }
    for(let ro of r.rows){
      let l=await c.query('SELECT 1 FROM up_permissions_role_lnk WHERE permission_id=' + pid + ' AND role_id=' + ro.id);
      if(l.rows.length===0){
        await c.query('INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES (' + pid + ', ' + ro.id + ')');
      }
    }
  }
  console.log('done');
  c.end();
});