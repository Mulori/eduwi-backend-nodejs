
module.exports = {
    async Welcome(req, res) {        
        return res.json({ 
            eduwi: 'Welcome to backend service eduwi',
            created: 'Service created in 2022-01-29',
            developed_by: 'Murilo Henrique Garcia Rodrigues',
            developer_nationality: 'Brazil'
        });
    },
};
