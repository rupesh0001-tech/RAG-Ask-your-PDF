import express from 'express';
import type { Request, Response } from 'express';
import { model } from './agents/GROQ';

const app = express();
const port = process.env.PORT || 8080; 

// Middleware to parse JSON request bodies
app.use(express.json());

app.post('/chat', async (req: Request, res: Response) => { 
    try{ 
        const data = req.body;


        const response = await model.invoke(data.prompt); 

        return res.status(200).json({ 
            message: 'data received successfully',
            data : response
         });
    }catch(error : any){ 
        return res.status(500).json({
            message: 'Internal server error',
            error: error?.message
        });
    }
})







app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

