// Gerado de open-routers-models.json (modelos com preco de entrada e saida iguais a zero).
const DATA_EXTRACAO_MODELOS = '2026-10-13';
const MODELOS_OPENROUTER = [
    {
        "id":  "inclusionai/ling-3.1-flash",
        "nome":  "inclusionAI: Ling 3.1 Flash",
        "fabricante":  "inclusionai",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Ling 3.1 Flash is a hybrid reasoning mixture-of-experts model from inclusionAI, with 25B active parameters out of 560B total."
    },
    {
        "id":  "apodex/apodex-1.1-mini:free",
        "nome":  "Apodex: Apodex 1.1 Mini",
        "fabricante":  "apodex",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Apodex 1.1 Mini is a reasoning-first model from Apodex, built for complex, long-horizon research and forecasting tasks. It works directly with files, data, code, and tools to produce verifiable results,..."
    },
    {
        "id":  "dots-studio/dots-3-note-preview:free",
        "nome":  "Dots Studio: Dots3-Note Preview",
        "fabricante":  "dots-studio",
        "contexto":  512000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Dots3-Note Preview is an open-weight mixture-of-experts model from Dots Studio, with 16B active parameters out of 280B total. It is the lightest model in the Dots 3 family and is..."
    },
    {
        "id":  "liquid/lfm-2.5-2.6b:free",
        "nome":  "LiquidAI: LFM2.5-2.6B",
        "fabricante":  "liquid",
        "contexto":  65536,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "LFM2.5-2.6B is a compact reasoning model from Liquid AI. It is suited for agent workflows, data extraction, RAG, and long-context processing. Liquid advises against using it for agentic coding or..."
    },
    {
        "id":  "nvidia/nemotron-3.5-lightning:free",
        "nome":  "NVIDIA: Nemotron 3.5 Lightning",
        "fabricante":  "nvidia",
        "contexto":  1000000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "NVIDIA Nemotron 3.5 Lightning is an open mixture-of-experts model from NVIDIA, with 3B active parameters out of 30B total. It is suited for high-throughput agentic workloads and specialized tasks that..."
    },
    {
        "id":  "thinkingmachines/inkling-small:free",
        "nome":  "Thinking Machines: Inkling Small",
        "fabricante":  "thinkingmachines",
        "contexto":  1048576,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Inkling Small is an open-weight multimodal mixture-of-experts model from Thinking Machines Lab, with 12B active parameters out of 276B total. It is positioned as the smaller, more efficient member of..."
    },
    {
        "id":  "poolside/laguna-s-2.1:free",
        "nome":  "Poolside: Laguna S 2.1",
        "fabricante":  "poolside",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Laguna S 2.1 is the latest coding agent model from [Poolside](\u003chttps://poolside.ai/\u003e). Laguna S 2.1 is a 118B total parameter model with 8B active parameters, scoring 70.2% on Terminal-Bench 2.1 and..."
    },
    {
        "id":  "thinkingmachines/inkling:free",
        "nome":  "Thinking Machines: Inkling",
        "fabricante":  "thinkingmachines",
        "contexto":  1048576,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Inkling is an open-weight multimodal mixture-of-experts model from Thinking Machines Lab, with 41B active parameters out of 975B total. It is designed for general-purpose reasoning, coding, agentic and tool-use systems,..."
    },
    {
        "id":  "poolside/laguna-xs-2.1:free",
        "nome":  "Poolside: Laguna XS 2.1",
        "fabricante":  "poolside",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Laguna XS 2.1 is the latest coding agent model in the 33B-A3B category from [Poolside](https://poolside.ai/) and a step forward from their Laguna XS.2 model (released in April 2026). It combines..."
    },
    {
        "id":  "cohere/north-mini-code:free",
        "nome":  "Cohere: North Mini Code",
        "fabricante":  "cohere",
        "contexto":  256000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "North Mini Code is Cohere\u0027s first agentic coding model and the debut of its North family. A sparse mixture-of-experts model with 30B total parameters and 3B active, it is optimized..."
    },
    {
        "id":  "nvidia/nemotron-3.5-content-safety:free",
        "nome":  "NVIDIA: Nemotron 3.5 Content Safety",
        "fabricante":  "nvidia",
        "contexto":  128000,
        "temFerramentas":  false,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "NVIDIA Nemotron 3.5 Content Safety is a compact 4B-parameter multimodal guardrail model from NVIDIA, fine-tuned from Google Gemma-3-4B. It moderates both inputs to and responses from LLMs and VLMs, accepting..."
    },
    {
        "id":  "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nome":  "NVIDIA: Nemotron 3 Ultra",
        "fabricante":  "nvidia",
        "contexto":  1000000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "NVIDIA Nemotron 3 Ultra is an open frontier-reasoning and orchestration model from NVIDIA, with 55B active parameters out of 550B total (MoE). Built on a hybrid Transformer-Mamba mixture-of-experts architecture, it..."
    },
    {
        "id":  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "nome":  "NVIDIA: Nemotron 3 Nano Omni",
        "fabricante":  "nvidia",
        "contexto":  256000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "NVIDIA Nemotron™ 3 Nano Omni is a 30B-A3B open multimodal model designed to function as a perception and context sub-agent in enterprise agent systems. It accepts text, image, video, and..."
    },
    {
        "id":  "google/gemma-4-26b-a4b-it:free",
        "nome":  "Google: Gemma 4 26B A4B",
        "fabricante":  "google",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Gemma 4 26B A4B IT is an instruction-tuned Mixture-of-Experts (MoE) model from Google DeepMind. Despite 25.2B total parameters, only 3.8B activate per token during inference — delivering near-31B quality at..."
    },
    {
        "id":  "google/gemma-4-31b-it:free",
        "nome":  "Google: Gemma 4 31B",
        "fabricante":  "google",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "Gemma 4 31B Instruct is Google DeepMind\u0027s 30.7B dense multimodal model supporting text and image input with text output. Features a 256K token context window, configurable thinking/reasoning mode, native function..."
    },
    {
        "id":  "google/lyria-3-pro-preview",
        "nome":  "Google: Lyria 3 Pro Preview",
        "fabricante":  "google",
        "contexto":  1048576,
        "temFerramentas":  false,
        "saidas":  [
                       "text",
                       "audio"
                   ],
        "descricao":  "Full-length songs are priced at $0.08 per song. Lyria 3 is Google\u0027s family of music generation models, available through the Gemini API. With Lyria 3, you can generate high-quality, 48kHz..."
    },
    {
        "id":  "google/lyria-3-clip-preview",
        "nome":  "Google: Lyria 3 Clip Preview",
        "fabricante":  "google",
        "contexto":  1048576,
        "temFerramentas":  false,
        "saidas":  [
                       "text",
                       "audio"
                   ],
        "descricao":  "30 second duration clips are priced at $0.04 per clip. Lyria 3 is Google\u0027s family of music generation models, available through the Gemini API. With Lyria 3, you can generate..."
    },
    {
        "id":  "nvidia/nemotron-3-super-120b-a12b:free",
        "nome":  "NVIDIA: Nemotron 3 Super",
        "fabricante":  "nvidia",
        "contexto":  262144,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "NVIDIA Nemotron 3 Super is a 120B-parameter open hybrid MoE model, activating just 12B parameters for maximum compute efficiency and accuracy in complex multi-agent applications. Built on a hybrid Mamba-Transformer..."
    },
    {
        "id":  "openrouter/free",
        "nome":  "Free Models Router",
        "fabricante":  "openrouter",
        "contexto":  200000,
        "temFerramentas":  true,
        "saidas":  [
                       "text"
                   ],
        "descricao":  "The simplest way to get free inference. openrouter/free is a router that selects free models at random from the models available on OpenRouter. The router smartly filters for models that..."
    }
];
