
module.exports = {
    async Welcome(req, res) {        
        return res.json({ 
            eduwi: 'Welcome to backend service eduwi - Bem vindo ao serviço de backend eduwi',
            created: 'Service created in 2022-01-29',
            developed_by: 'Murilo Henrique Garcia Rodrigues',
            developer_nationality: 'Brazil',            
            hosted_in: "Plataform Digital Ocean"
        });
    },
};
