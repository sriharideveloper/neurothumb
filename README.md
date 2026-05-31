# Neurothumb - Powered by Croissant Labs

**An open-source AI platform for analyzing YouTube thumbnails and channels using neuroscience-powered TRIBE v2 model with Bring-Your-Own-Key (BYOK) integration.**

Neurothumb is a sophisticated web application that leverages the TRIBE v2 model from Square-Zero-Labs to analyze how YouTube thumbnails and channel content engage different regions of the human brain. This open-source version enables developers to deploy their own instance with complete control over API keys and infrastructure.

## ⚡ Quick Start (5 Minutes)

**Want to get started immediately?** See [QUICKSTART.md](QUICKSTART.md) for a streamlined setup guide.

## Features

- **Single Thumbnail Analysis**: Upload or provide a URL to analyze how a YouTube thumbnail engages brain regions
- **Channel Analysis**: Batch analyze multiple videos from a YouTube channel to identify engagement patterns
- **Brain Region Mapping**: Visualize neural activation across 360 cortical regions organized into functional groups (visual, auditory, language, attention, motor)
- **TRIBE v2 Integration**: State-of-the-art neuroscience model for predicting neural responses to visual stimuli
- **Bring-Your-Own-Key (BYOK) System**: Configure your own Modal, Supabase, and Gemini API keys
- **Real-time Heatmaps**: Generate interactive brain activation visualizations
- **Batch Processing**: Analyze entire YouTube channels with intelligent video selection
- **Correlation Analysis**: Identify relationships between thumbnail engagement and video performance metrics

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 16, React 19, Framer Motion | Modern UI with smooth animations |
| Backend | Modal.com | Serverless GPU compute for TRIBE v2 inference |
| Database | Supabase (PostgreSQL) | User data and analysis history storage |
| AI Models | TRIBE v2 (Square-Zero-Labs), Google Gemini | Neural analysis and text generation |
| Styling | SCSS, Tailwind CSS | Responsive design system |
| Deployment | Vercel, Modal | Production hosting and scaling |

## Required Environment Variables

All of these variables are **required** for the application to function:

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key (server-side only) |
| `MODAL_ENDPOINT_URL` | Public | Modal endpoint for single thumbnail analysis |
| `MODAL_CHANNEL_ENDPOINT_URL` | Public | Modal endpoint for channel analysis |
| `MODAL_ASYNC_ENDPOINT_URL` | Public | Modal endpoint for async analysis (optional) |
| `MODAL_RESULT_ENDPOINT_URL` | Public | Modal endpoint for retrieving results (optional) |
| `GEMINI_API_KEY` | Secret | Google Gemini API key (optional, for enhanced analysis) |

## Prerequisites

- Node.js 18+
- Python 3.11+
- Accounts: [Modal.com](https://modal.com), [Supabase.com](https://supabase.com), [Google AI Studio](https://aistudio.google.com)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/sriharideveloper/neurothumb.git
cd neurothumb
pnpm install
```

### 2. Deploy Modal Backend

```bash
# Install Modal CLI
pip install modal

# Authenticate with Modal
modal token new

# Deploy the backend
cd modal_backend
modal deploy backend.py
```

After deployment, copy the endpoints displayed in the terminal.

### 3. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy:
   - Project URL
   - anon public key
   - service_role secret key
3. Run database migrations:
   ```bash
   psql -h your-db-host -U postgres -f supabase_schema.sql
   ```

### 4. Configure Environment

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Modal
MODAL_ENDPOINT_URL=https://your-username--croissant-analyze.modal.run
MODAL_CHANNEL_ENDPOINT_URL=https://your-username--croissant-analyze-channel.modal.run
MODAL_ASYNC_ENDPOINT_URL=https://your-username--croissant-async.modal.run
MODAL_RESULT_ENDPOINT_URL=https://your-username--croissant-result.modal.run

# Gemini (Optional)
GEMINI_API_KEY=your-gemini-api-key
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## BYOK System Architecture

The Neurothumb BYOK system allows complete control over external service integrations:

### Modal (Compute)

Modal provides serverless GPU compute for running the TRIBE v2 model. The backend automatically:

- Loads the pre-trained TRIBE v2 model on container startup
- Caches the model in a persistent volume for fast subsequent runs
- Handles concurrent requests with configurable concurrency limits
- Returns structured JSON with neural metrics and brain heatmaps

**Endpoints**:
- `MODAL_ENDPOINT_URL`: Single thumbnail analysis
- `MODAL_CHANNEL_ENDPOINT_URL`: Channel batch analysis
- `MODAL_ASYNC_ENDPOINT_URL`: Async analysis (optional)
- `MODAL_RESULT_ENDPOINT_URL`: Result retrieval (optional)

### Supabase (Database & Storage)

Supabase provides PostgreSQL database and file storage for:

- User authentication and session management
- Analysis history and results caching
- Thumbnail and heatmap image storage
- Trial usage tracking and quotas

### Gemini (AI Enhancement)

Google Gemini API provides optional text generation for:

- YouTube Strategist Audit summaries
- Content recommendations based on neural engagement
- Narrative analysis of channel patterns

## API Endpoints

### Single Thumbnail Analysis

**POST** `/api/analyze`

```json
{
  "image_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
}
```

**Response**:

```json
{
  "metrics": {
    "n_timesteps": 60,
    "peak_timestep": 42,
    "peak_top_roi": "V4-rh",
    "peak_top_roi_score": 0.8234,
    "mean_top_roi_score": 0.6521,
    "visual_mean": 0.7123,
    "auditory_speech_mean": 0.4521,
    "language_semantic_mean": 0.5234,
    "attention_control_mean": 0.6789,
    "motor_somato_mean": 0.3456
  },
  "heatmap_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

### Channel Analysis

**POST** `/api/analyze`

```json
{
  "channel_handle": "@veritasium",
  "total_videos": 10,
  "days_old_min": 14,
  "min_duration_sec": 180,
  "playlist_end": 80
}
```

**Response**:

```json
{
  "channel_handle": "@veritasium",
  "results": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "view_count": 1500000,
      "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "metrics": { ... },
      "heatmap_base64": "..."
    }
  ],
  "correlations": {
    "visual_vs_views": 0.7234,
    "attention_vs_views": 0.6123
  }
}
```

## Project Structure

```
neurothumb/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── analyze/route.js      # Main analysis endpoint
│   ├── login/                    # Authentication pages
│   ├── page.jsx                  # Home page
│   ├── layout.jsx                # Root layout
│   └── globals.scss              # Global styles
├── components/                   # Reusable React components
├── lib/                          # Utility functions
│   ├── byok-config.js           # BYOK configuration
│   └── byok-server.js           # Server-side config
├── modal_backend/                # Modal serverless backend
│   ├── backend.py                # TRIBE v2 inference code
│   └── requirements.txt           # Python dependencies
├── scripts/                      # Setup and utility scripts
│   ├── setup-modal.sh            # Linux/macOS setup
│   ├── setup-modal.ps1           # Windows setup
│   └── extract-endpoints.js      # Endpoint extraction utility
├── docs/                         # Documentation
├── public/                       # Static assets
├── .env.local                    # BYOK credentials (not in git)
├── package.json                  # Node.js dependencies
├── supabase_schema.sql           # Database schema
├── QUICKSTART.md                 # 5-minute quick start guide
├── ENV_SETUP.md                  # Detailed environment setup
├── DEPLOYMENT.md                 # Production deployment guide
└── README.md                     # This file
```

## TRIBE v2 Model Details

The TRIBE v2 model predicts neural responses across 360 cortical regions organized into five functional groups:

| Functional Group | Regions | Purpose |
|------------------|---------|---------|
| **Visual** | V1-V7, MT, FFC, PHA, VMV, VVC | Processes visual information from thumbnails |
| **Auditory & Speech** | A1-A5, STG, TA2 | Responds to audio cues and speech patterns |
| **Language & Semantic** | Broca's, Wernicke's, IFJ, TE | Processes linguistic and semantic content |
| **Attention & Control** | FEF, PEF, IP, LIP, 8B, 9-46 | Manages attention allocation and executive control |
| **Motor & Somatosensory** | M1-M4, S1-S3, 6a-6v | Processes motor planning and body awareness |

## Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Deployment

### Frontend Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (recommended)
- Netlify
- Self-hosted servers

### Backend Deployment

```bash
cd modal_backend
modal deploy backend.py
```

### Database

Supabase is managed through their dashboard. No additional deployment needed.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC-BY-NC 4.0)** license - see [LICENSE](LICENSE) for details.

This ensures consistency with the underlying TRIBE v2 model, which is also licensed under CC-BY-NC 4.0.

**Key Points**:
- ✓ Non-commercial use allowed
- ✓ Modification and adaptation permitted
- ✓ Distribution and sharing allowed
- ✗ Commercial use prohibited without explicit permission
- ✓ Attribution required

For commercial use, please contact the authors for a commercial license.

## Citation

If you use Neurothumb in your research, please cite:

```bibtex
@software{neurothumb2026,
  title={Neurothumb: Open-Source YouTube Thumbnail Analysis via TRIBE v2},
  author={Srihari Muralikrishnan},
  year={2026},
  url={https://github.com/sriharideveloper/neurothumb}
}

@software{tribev2,
  title={TRIBE v2: Predicting Brain Responses to Visual Stimuli},
  author={Square-Zero-Labs},
  year={2024},
  url={https://github.com/Square-Zero-Labs/tribev2}
}
```

## Acknowledgments

- **TRIBE v2 Model**: Square-Zero-Labs
- **Modal Infrastructure**: Modal.com
- **Database**: Supabase
- **AI Enhancement**: Google Gemini
- **Open Source Community**: All contributors and users

## Support

For issues, questions, or suggestions:

1. Check existing [GitHub Issues](https://github.com/sriharideveloper/neurothumb/issues)
2. Read [QUICKSTART.md](QUICKSTART.md) for quick setup help
3. Read [ENV_SETUP.md](ENV_SETUP.md) for detailed environment configuration
4. Create a new issue with detailed description

---

**Neurothumb** - Powered by **Croissant Labs** 🥐

*Making neuroscience-powered content analysis accessible to everyone.*
