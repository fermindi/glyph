# Glyph - Especificação de Conteúdo

## 1. Hierarquia de Headings

O Glyph deve interpretar headings Markdown de forma hierárquica para navegação:

```
#     → Capítulo (Chapter)      → Nível 1 no TOC
##    → Seção (Section)         → Nível 2 no TOC
###   → Subseção (Subsection)   → Nível 3 no TOC (opcional)
####  → Item interno            → NÃO aparece no TOC
```

### Regras de Navegação

| Heading | Comportamento | Exemplo |
|---------|---------------|---------|
| `#` | **Ponto de navegação principal**. Marca início de capítulo. Sempre aparece no TOC. | `# Capítulo 2. O Balanço Patrimonial` |
| `##` | **Ponto de navegação secundário**. Marca seção dentro do capítulo. Aparece como item aninhado no TOC. | `## O que são Ativos?` |
| `###` | **Navegação terciária** (configurável). Pode aparecer no TOC expandido ou apenas como âncora. | `### T1. Vender 150.000 ações...` |
| `####` | **Não navegável**. Usado para labels internos (tabelas, demonstrativos). Não aparece no TOC. | `#### DRE` |

### Implementação do TOC

```typescript
interface TocEntry {
  level: 1 | 2 | 3;           // Baseado em #, ##, ###
  title: string;               // Texto do heading (sem o #)
  anchor: string;              // ID para navegação (do {#id} ou gerado)
  children?: TocEntry[];       // Sub-itens (## dentro de #, etc.)
}

function parseToc(markdown: string): TocEntry[] {
  const headingRegex = /^(#{1,3})\s+(.+?)(?:\s+\{#([a-zA-Z0-9_-]+)\})?$/gm;
  // Ignora #### e níveis menores
  // Extrai: nível, título, âncora opcional
}
```

### Extração de Âncoras

Muitos headings têm IDs explícitos no formato `{#anchor_id}`:

```markdown
## A Equação Básica da Contabilidade {#a4nu}
## O Balanço Patrimonial {#id__212_11_the_balance_sheet}
```

**Regras:**
1. Se `{#id}` existe → usar como âncora
2. Se não existe → gerar slug do título (ex: `o-que-sao-ativos`)
3. Garantir unicidade (adicionar `-2`, `-3` se duplicado)

---

## 2. Imagens

### Formato de Referência

Imagens seguem sintaxe Markdown padrão:

```markdown
![alt text](caminho/para/imagem.jpg)
![](../images/image_rsrc5CD.jpg)
```

### Resolução de Caminhos

O caminho da imagem é **relativo ao arquivo MD**. O Glyph precisa resolver para caminho absoluto:

```typescript
function resolveImagePath(
  imageSrc: string,           // "../images/image_rsrc5CD.jpg"
  currentFile: string,        // "/books/Financial/final/chapter1.md"
  bookRoot: string            // "/books/Financial"
): string {
  // Se caminho relativo (começa com . ou ..)
  if (imageSrc.startsWith('.')) {
    const dir = path.dirname(currentFile);
    return path.resolve(dir, imageSrc);
  }

  // Se caminho absoluto (começa com /)
  if (imageSrc.startsWith('/')) {
    return path.join(bookRoot, imageSrc);
  }

  // Caminho simples - relativo ao arquivo atual
  return path.join(path.dirname(currentFile), imageSrc);
}
```

### Estrutura de Pastas Esperada

Para projetos Babelfish:
```
book_project/
├── final/                    ← Arquivos MD finais
│   ├── 01_title_page.md
│   ├── 02_chapter_1.md
│   └── images/               ← Imagens copiadas (ou symlink)
│       ├── image_rsrc5CD.jpg
│       └── ...
└── source/
    └── images/               ← Imagens originais
        └── image_rsrc5CD.jpg
```

**Problema atual:** Os MDs referenciam `../images/` mas a pasta `final/` não tem as imagens.

### Soluções para Imagens

**Opção A: Copiar imagens no assembly (Babelfish)**
```python
# No dashboard.py, durante assembly
import shutil
images_src = project.paths.source / "images"
images_dst = project.paths.final / "images"
if images_src.exists() and not images_dst.exists():
    shutil.copytree(images_src, images_dst)
```

**Opção B: Resolver no Glyph (fallback inteligente)**
```typescript
function findImage(imagePath: string, bookPaths: BookPaths): string | null {
  // 1. Tentar caminho exato
  if (fs.existsSync(imagePath)) return imagePath;

  // 2. Tentar em final/images/
  const inFinal = path.join(bookPaths.final, 'images', path.basename(imagePath));
  if (fs.existsSync(inFinal)) return inFinal;

  // 3. Tentar em source/images/
  const inSource = path.join(bookPaths.source, 'images', path.basename(imagePath));
  if (fs.existsSync(inSource)) return inSource;

  // 4. Busca recursiva por nome
  return findFileRecursive(bookPaths.root, path.basename(imagePath));
}
```

**Opção C: Reescrever caminhos no import**
```typescript
// Ao importar livro, normalizar todos os caminhos de imagem
function normalizeImagePaths(markdown: string, imagesDir: string): string {
  return markdown.replace(
    /!\[(.*?)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      const filename = path.basename(src);
      return `![${alt}](images/${filename})`;
    }
  );
}
```

### Renderização de Imagens

```tsx
// components/Reader/MarkdownImage.tsx
interface MarkdownImageProps {
  src: string;
  alt: string;
  bookPath: string;
}

function MarkdownImage({ src, alt, bookPath }: MarkdownImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Resolver caminho via IPC (main process tem acesso ao filesystem)
    window.electron.resolveImagePath(src, bookPath)
      .then(setResolvedSrc)
      .catch(() => setError(true));
  }, [src, bookPath]);

  if (error) {
    return (
      <div className="image-placeholder">
        <span>📷 {alt || 'Imagem não encontrada'}</span>
        <span className="image-path">{src}</span>
      </div>
    );
  }

  if (!resolvedSrc) {
    return <div className="image-loading">Carregando...</div>;
  }

  return (
    <img
      src={`file://${resolvedSrc}`}
      alt={alt}
      className="reader-image"
      onError={() => setError(true)}
    />
  );
}
```

---

## 3. Configuração do react-markdown

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

const components = {
  // Headings com âncoras para navegação
  h1: ({ children, id }) => (
    <h1 id={id} className="chapter-title">{children}</h1>
  ),
  h2: ({ children, id }) => (
    <h2 id={id} className="section-title">{children}</h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="subsection-title">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="internal-label">{children}</h4>  // Sem id, não navegável
  ),

  // Imagens com resolução de caminho
  img: ({ src, alt }) => (
    <MarkdownImage src={src} alt={alt} bookPath={currentBookPath} />
  ),
};

function MarkdownViewer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}  // Auto-gera IDs para headings sem {#id}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

## 4. Detecção de Projeto Babelfish

Quando o usuário abre uma pasta, verificar se é projeto Babelfish:

```typescript
interface BabelfishProject {
  root: string;
  source: string;
  final: string;
  images: string;
  manifest?: BookManifest;
}

function detectBabelfishProject(folderPath: string): BabelfishProject | null {
  const bookYaml = path.join(folderPath, 'book.yaml');
  const manifest = path.join(folderPath, 'book_manifest.yaml');

  if (!fs.existsSync(bookYaml)) return null;

  const project: BabelfishProject = {
    root: folderPath,
    source: path.join(folderPath, 'source'),
    final: path.join(folderPath, 'final'),
    images: path.join(folderPath, 'source', 'images'),
  };

  if (fs.existsSync(manifest)) {
    project.manifest = yaml.parse(fs.readFileSync(manifest, 'utf-8'));
  }

  return project;
}
```

---

## 5. Índice de Capítulos (toc.json)

O Babelfish gera um arquivo `toc.json` na pasta `final/` com os títulos corretos:

```json
{
  "title": "Financial Statements",
  "author": "Thomas Ittelson",
  "language": "pt-br",
  "chapters": [
    {
      "order": 1,
      "file": "01_01_title_page.md",
      "title": "Página de Título",
      "id": "01_title_page"
    },
    {
      "order": 2,
      "file": "02_02_copyright.md",
      "title": "Direitos Autorais",
      "id": "02_copyright"
    }
  ]
}
```

### Uso no Glyph

```typescript
interface TocJson {
  title: string;
  author: string;
  language: string;
  chapters: {
    order: number;
    file: string;      // Nome do arquivo MD
    title: string;     // Título para exibir no menu
    id: string;        // ID interno do capítulo
  }[];
}

function loadBookToc(bookPath: string): TocJson | null {
  const tocPath = path.join(bookPath, 'final', 'toc.json');
  if (fs.existsSync(tocPath)) {
    return JSON.parse(fs.readFileSync(tocPath, 'utf-8'));
  }

  // Fallback: usar nomes de arquivo
  return null;
}

// No componente de sidebar/menu:
function ChapterList({ toc }: { toc: TocJson }) {
  return (
    <ul>
      {toc.chapters.map(ch => (
        <li key={ch.id}>
          <a href={`#${ch.file}`}>{ch.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### Fallback (sem toc.json)

Se `toc.json` não existir:
1. Usar ordem alfabética dos arquivos `.md`
2. Extrair título do primeiro `# Heading` de cada arquivo
3. Se não houver heading, usar nome do arquivo formatado

---

## Resumo de Ações Necessárias

### No Babelfish (assembly):
1. ✅ Copia imagens para `final/images/`
2. ✅ Reescreve paths de `../images/` para `images/`
3. ✅ Gera `toc.json` com títulos corretos dos capítulos

### No Glyph:
1. Carregar `toc.json` para montar menu com títulos corretos
2. Parsear headings `#`, `##`, `###` para TOC interno (ignorar `####`)
3. Extrair âncoras `{#id}` dos headings
4. Implementar fallback de busca de imagens
5. Detectar projeto Babelfish e usar estrutura
6. Usar `file://` protocol para carregar imagens locais
