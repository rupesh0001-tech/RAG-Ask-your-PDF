import express from 'express';
import type { Request, Response } from 'express';
import { model } from './agents/GROQ';
import multer from 'multer';
import path from 'path'; // 👈 Added missing path import
import fs from 'fs'; // 👈 Added fs to read the uploaded file
import pdfParse from 'pdf-parse'; // 👈 Added PDF parser
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { vectorStore } from './vector_db';

const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse JSON request bodies
app.use(express.json());

// Frontend CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Configure storage destination and file names
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Filter to strictly accept PDF files (with explicit Express/Multer types)
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'));
    }
};

const upload = multer({ storage, fileFilter });

// POST route to handle single PDF upload and extract its content
app.post('/upload', upload.single('pdf'), async (req: Request, res: Response): Promise<any> => {
    try {
        const pdfFile = req.file;

        if (!pdfFile) {
            return res.status(400).json({
                message: 'No PDF file uploaded'
            });
        }

        // 1. Read the binary buffer of the uploaded file
        const dataBuffer = fs.readFileSync(pdfFile.path);

        // 2. Parse the PDF text contents
        const parsedPdf = await pdfParse(dataBuffer);
        const extractedText = parsedPdf.text;

        // 3. Optional: Pass the text to your GROQ agent for an automatic summary or action
        // const systemPrompt = `You are a helpful assistant analyzing a PDF document. Here is the content of the PDF:\n\n${extractedText}\n\nPlease summarize this document in 3 sentences.`;

        // 4. create emmbeddings  and save it in vector DB 

        const spilitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        })

        const docs = await spilitter.createDocuments([extractedText]);
        await vectorStore.addDocuments(docs);




        // 4. Return the results
        return res.status(200).json({
            message: 'PDF uploaded and processed successfully',
            meta: {
                originalName: pdfFile.originalname,
                savedAs: pdfFile.filename,
                totalPages: parsedPdf.numpages
            },
            summary: aiResponse
        });

    } catch (error: any) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error?.message
        });
    }
});

// POST route to handle ongoing chat interactions
app.post('/chat', async (req: Request, res: Response): Promise<any> => {
    try {
        const { prompt } = req.body
        const docs = await vectorStore.similaritySearch(prompt, 5)
        const context = docs.map(doc => doc.pageContent).join("/n")
        const result = await model.invoke([
            {
                role: "system",
                content: `you are a rag assistant and use this context ${context}`
            },
            {
                role: "human",
                content: prompt
            }
        ])
        return res.json(result.content)
    } catch (error: any) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error?.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
