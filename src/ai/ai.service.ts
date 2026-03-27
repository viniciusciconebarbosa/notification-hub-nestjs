import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {

    private readonly logger = new Logger(AiService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly modelName = 'gemini-2.0-flash';

    constructor(private readonly configService: ConfigService) {

        const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async refineNotificationContent(rawContent: string): Promise<string> {

        this.logger.log(`Sending content to Gemini (${this.modelName}) for refinement...`);
        const model = this.genAI.getGenerativeModel({ model: this.modelName });

        const prompt = `Você é um assistente especializado em comunicação corporativa.
                    Reescreva a seguinte mensagem de notificação de forma clara, profissional e amigável, mantendo todas as informações originais.
                    Retorne APENAS o texto refinado, sem explicações, sem comentários adicionais e sem formatação markdown.

                    Mensagem original:
        ${rawContent}`;

        const result = await model.generateContent(prompt);
        const refined = result.response.text().trim();

        this.logger.log('Content successfully refined by Gemini.');
        return refined;
    }
}
