const {PrismaClient}=require('@prisma/client'); 
const p=new PrismaClient(); 
p.usuario.update({where:{email:'admin@xtelhas.com'},data:{senhaHash:'$2a$12$7rojtEQFxc38j/oO0ROev.zys0M7dqmqH3gQ4DFoDaDSZ3rNhB6xi'}}).then(u=>console.log('OK:',u.email)).finally(()=>p.$disconnect()); 
