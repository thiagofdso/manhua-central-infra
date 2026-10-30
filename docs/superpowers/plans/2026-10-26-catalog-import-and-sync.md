# Catálogo Canônico: Importação de Obras e Carga Inicial — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de importação de obras externas (Go API Gateway + Redis cache + Angular Web Client) e a rotina de carga inicial (`sync-catalog`) para popular o catálogo global PostgreSQL com obras reais de múltiplas plataformas.

**Architecture:** A API Go expõe `/api/import/domains`, `/api/import/browse` e `/api/import`, utilizando um registro extensível de scrapers (`ProviderRegistry`) com cache Redis de 7 dias e persistência atômica no PostgreSQL (`canonical_manhuas` e `user_libraries`). No frontend Angular 18, um modal dedicado (`ImportDialogComponent`) segue à risca `PRODUCT.md` e `DESIGN.md` para navegação, seleção em lote e importação. A rotina `cmd/sync-catalog` faz a ingestão inicial em massa de obras populares.

**Tech Stack:** Go 1.23, goquery, PostgreSQL 16 (pq), Redis 7 (go-redis), Angular 18 (Standalone, Signals, CommonModule, FormsModule), Tailwind CSS, Jasmine/Karma.

## Global Constraints

- Design System obrigatório: `PRODUCT.md` e `DESIGN.md`. Cores `#090d16` (fundo), `#0f172a` (superfície), `#141c2e` (elevação), `#6366f1` (primária sólida), `#10b981` (sucesso), `#ef4444` (perigo).
- Proibição estrita de AI slop: sem textos em degradê (`bg-clip-text`), sem botões com gradiente roxo, sem `border-left` decorativo em cards, sem glassmorphism gratuito.
- Acessibilidade WCAG 2.1 nível AA: contraste de texto $\ge 4.5:1$, áreas de toque $\ge 44\times 44\text{px}$, suporte a `prefers-reduced-motion: reduce`.
- Cache no Redis para browse com chave `import:cache:{domain}:{q}:{page}` e TTL de 7 dias (`604800s`).
- Regra de Negócio RN-03.3: ao importar obras para a biblioteca, aplicar ordenação `customOrder = min_order - 1`.
- Polyrepo Git: commits atômicos em `apps/api-gateway`, `apps/web-client` e na raiz, direcionados para o branch `desenv`.

---

### Task 1: Provider Registry e Scrapers MangaK/ManhuaTop em Go

**Files:**
- Create: `apps/api-gateway/internal/providers/registry.go`
- Create: `apps/api-gateway/internal/providers/mangak.go`
- Create: `apps/api-gateway/internal/providers/manhuatop.go`
- Test: `apps/api-gateway/internal/providers/registry_test.go`

**Interfaces:**
- Consumes: `domain.ScrapeResult`, `domain.ScrapedItem` de `internal/domain`.
- Produces: `DomainScraper` interface e `ProviderRegistry` struct com métodos `Register(DomainScraper)`, `Get(domain string) (DomainScraper, bool)` e `ListDomains() []DomainInfo`.

- [ ] **Step 1: Escrever teste falho para o ProviderRegistry e Scrapers**

Criar `apps/api-gateway/internal/providers/registry_test.go`:
```go
package providers_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/providers"
)

func TestProviderRegistry_RegistrationAndLookup(t *testing.T) {
	reg := providers.NewProviderRegistry()

	asura := providers.NewAsuraScansScraper()
	raven := providers.NewRavenScansScraper()
	mangak := providers.NewMangaKScraper()
	top := providers.NewManhuaTopScraper()

	reg.Register(asura)
	reg.Register(raven)
	reg.Register(mangak)
	reg.Register(top)

	domains := reg.ListDomains()
	if len(domains) < 4 {
		t.Fatalf("expected at least 4 domains registered, got %d", len(domains))
	}

	sc, exists := reg.Get("asurascans.com")
	if !exists || sc == nil {
		t.Fatalf("expected asurascans.com to be registered")
	}

	if sc.Name() != "Asura Scans" {
		t.Errorf("expected name 'Asura Scans', got '%s'", sc.Name())
	}
}

func TestMangaKScraper_SearchOrBrowse(t *testing.T) {
	mockHTML := `
	<div class="story-item">
		<a href="https://mangak.io/manga/solo-leveling" title="Solo Leveling">
			<img src="https://mangak.io/cover.jpg" alt="Solo Leveling" />
		</a>
		<h3 class="story-title"><a href="https://mangak.io/manga/solo-leveling">Solo Leveling</a></h3>
		<span class="chapter-item">Chapter 200</span>
	</div>
	`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(mockHTML))
	}))
	defer srv.Close()

	scraper := providers.NewMangaKScraperWithURL(srv.URL)
	res, err := scraper.SearchOrBrowse(context.Background(), "", 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(res.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(res.Items))
	}

	if res.Items[0].Title != "Solo Leveling" {
		t.Errorf("expected title 'Solo Leveling', got '%s'", res.Items[0].Title)
	}
	if *res.Items[0].LastChapter != 200 {
		t.Errorf("expected lastChapter 200, got %d", *res.Items[0].LastChapter)
	}
}
```

- [ ] **Step 2: Rodar teste para verificar que falha**

Run: `cd apps/api-gateway && go test -v ./internal/providers -run TestProviderRegistry`  
Expected: Falha de compilação por tipos não definidos (`NewProviderRegistry`, `NewMangaKScraper`, etc.).

- [ ] **Step 3: Implementar `registry.go`, `mangak.go` e `manhuatop.go`**

Criar `apps/api-gateway/internal/providers/registry.go`:
```go
package providers

import (
	"context"
	"strings"
	"sync"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
)

type DomainInfo struct {
	Domain    string `json:"domain"`
	Name      string `json:"name"`
	Supported bool   `json:"supported"`
}

type DomainScraper interface {
	Domain() string
	Name() string
	SearchOrBrowse(ctx context.Context, query string, page int) (*domain.ScrapeResult, error)
}

type ProviderRegistry struct {
	mu        sync.RWMutex
	providers map[string]DomainScraper
}

func NewProviderRegistry() *ProviderRegistry {
	return &ProviderRegistry{
		providers: make(map[string]DomainScraper),
	}
}

func (r *ProviderRegistry) Register(scraper DomainScraper) {
	r.mu.Lock()
	defer r.mu.Unlock()
	clean := strings.ToLower(strings.TrimSpace(scraper.Domain()))
	r.providers[clean] = scraper
}

func (r *ProviderRegistry) Get(domain string) (DomainScraper, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	clean := strings.ToLower(strings.TrimSpace(domain))
	clean = strings.TrimPrefix(clean, "www.")
	sc, ok := r.providers[clean]
	return sc, ok
}

func (r *ProviderRegistry) ListDomains() []DomainInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []DomainInfo
	for _, p := range r.providers {
		list = append(list, DomainInfo{
			Domain:    p.Domain(),
			Name:      p.Name(),
			Supported: true,
		})
	}
	return list
}
```

Criar `apps/api-gateway/internal/providers/mangak.go`:
```go
package providers

import (
	"context"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
)

var (
	mangakChapterRegex = regexp.MustCompile(`(?i)(?:chapter|ch\.?)\s*(\d+)`)
)

type MangaKScraper struct {
	baseURL    string
	httpClient *http.Client
}

func NewMangaKScraper() *MangaKScraper {
	return NewMangaKScraperWithURL("https://mangak.io")
}

func NewMangaKScraperWithURL(baseURL string) *MangaKScraper {
	return &MangaKScraper{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *MangaKScraper) Domain() string {
	return "mangak.io"
}

func (s *MangaKScraper) Name() string {
	return "MangaK"
}

func (s *MangaKScraper) SearchOrBrowse(ctx context.Context, query string, page int) (*domain.ScrapeResult, error) {
	var targetURL string
	qKey := strings.TrimSpace(query)
	if qKey != "" {
		targetURL = fmt.Sprintf("%s/search?q=%s", s.baseURL, url.QueryEscape(qKey))
		if page > 1 {
			targetURL = fmt.Sprintf("%s&page=%d", targetURL, page)
		}
	} else {
		targetURL = fmt.Sprintf("%s/filter?page=%d", s.baseURL, page)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://mangak.io/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("mangak request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mangak returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse html: %w", err)
	}

	var items []domain.ScrapedItem
	doc.Find("div.story-item, div.manga-item, .list-story-item").Each(func(i int, sel *goquery.Selection) {
		link := sel.Find("a[href*='/manga/']").First()
		href, exists := link.Attr("href")
		if !exists {
			return
		}

		parts := strings.Split(strings.Trim(href, "/"), "/")
		slug := parts[len(parts)-1]

		title := strings.TrimSpace(sel.Find("h3, .story-title, .title").First().Text())
		if title == "" {
			title = strings.TrimSpace(link.AttrOr("title", slug))
		}
		title = html.UnescapeString(title)

		coverURL := sel.Find("img").First().AttrOr("src", "")
		if strings.HasPrefix(coverURL, "//") {
			coverURL = "https:" + coverURL
		}

		cardText := sel.Text()
		var lastChapter *int
		if matches := mangakChapterRegex.FindStringSubmatch(cardText); len(matches) > 1 {
			if ch, err := strconv.Atoi(matches[1]); err == nil {
				lastChapter = &ch
			}
		}

		urlTemplate := fmt.Sprintf("https://mangak.io/manga/%s/chapter-{chapter}", slug)

		items = append(items, domain.ScrapedItem{
			Title:         title,
			Slug:          slug,
			URLTemplate:   urlTemplate,
			CoverURL:      coverURL,
			LastChapter:   lastChapter,
			PrimaryDomain: "mangak.io",
		})
	})

	return &domain.ScrapeResult{
		Items:      items,
		Page:       page,
		TotalPages: 10,
	}, nil
}
```

Criar `apps/api-gateway/internal/providers/manhuatop.go`:
```go
package providers

import (
	"context"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
)

var (
	manhuatopChapterRegex = regexp.MustCompile(`(?i)(?:chapter|ch\.?)\s*(\d+)`)
)

type ManhuaTopScraper struct {
	baseURL    string
	httpClient *http.Client
}

func NewManhuaTopScraper() *ManhuaTopScraper {
	return NewManhuaTopScraperWithURL("https://manhuatop.org")
}

func NewManhuaTopScraperWithURL(baseURL string) *ManhuaTopScraper {
	return &ManhuaTopScraper{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *ManhuaTopScraper) Domain() string {
	return "manhuatop.org"
}

func (s *ManhuaTopScraper) Name() string {
	return "ManhuaTop"
}

func (s *ManhuaTopScraper) SearchOrBrowse(ctx context.Context, query string, page int) (*domain.ScrapeResult, error) {
	var targetURL string
	qKey := strings.TrimSpace(query)
	if qKey != "" {
		targetURL = fmt.Sprintf("%s/page/%d/?s=%s&post_type=wp-manga", s.baseURL, page, url.QueryEscape(qKey))
	} else {
		targetURL = fmt.Sprintf("%s/manhua/page/%d/", s.baseURL, page)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://manhuatop.org/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("manhuatop request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("manhuatop returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse html: %w", err)
	}

	var items []domain.ScrapedItem
	doc.Find("div.page-item-detail, div.c-tabs-item__content").Each(func(i int, sel *goquery.Selection) {
		link := sel.Find("a[href*='/manhua/']").First()
		href, exists := link.Attr("href")
		if !exists {
			return
		}

		parts := strings.Split(strings.Trim(href, "/"), "/")
		slug := parts[len(parts)-1]

		title := strings.TrimSpace(sel.Find(".post-title, h3, h4").First().Text())
		if title == "" {
			title = strings.TrimSpace(link.AttrOr("title", slug))
		}
		title = html.UnescapeString(title)

		coverURL := sel.Find("img").First().AttrOr("src", "")
		if strings.HasPrefix(coverURL, "//") {
			coverURL = "https:" + coverURL
		}

		cardText := sel.Text()
		var lastChapter *int
		if matches := manhuatopChapterRegex.FindStringSubmatch(cardText); len(matches) > 1 {
			if ch, err := strconv.Atoi(matches[1]); err == nil {
				lastChapter = &ch
			}
		}

		urlTemplate := fmt.Sprintf("https://manhuatop.org/manhua/%s/chapter-{chapter}", slug)

		items = append(items, domain.ScrapedItem{
			Title:         title,
			Slug:          slug,
			URLTemplate:   urlTemplate,
			CoverURL:      coverURL,
			LastChapter:   lastChapter,
			PrimaryDomain: "manhuatop.org",
		})
	})

	return &domain.ScrapeResult{
		Items:      items,
		Page:       page,
		TotalPages: 10,
	}, nil
}
```

- [ ] **Step 4: Executar os testes e garantir aprovação**

Run: `cd apps/api-gateway && go test -v ./internal/providers/...`  
Expected: PASS com 100% de sucesso.

- [ ] **Step 5: Commit atômico**

```bash
cd apps/api-gateway
git add internal/providers/
git commit -m "feat(providers): add ProviderRegistry and MangaK/ManhuaTop scrapers"
```

---

### Task 2: Import Service com Cache Redis e Anotação de Obras

**Files:**
- Create: `apps/api-gateway/internal/service/import_service.go`
- Test: `apps/api-gateway/internal/service/import_service_test.go`

**Interfaces:**
- Consumes: `providers.ProviderRegistry`, `repository.CanonicalRepository`, `service.LibraryService`, `repository.RedisService`.
- Produces: `ImportService` struct com métodos `Browse(ctx, domain, query, page, userID)` e `ImportWorks(ctx, userID, items)`.

- [ ] **Step 1: Escrever teste unitário para ImportService**

Criar `apps/api-gateway/internal/service/import_service_test.go`:
```go
package service_test

import (
	"context"
	"testing"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/providers"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/service"
)

type mockScraper struct {
	domain string
	name   string
}

func (m *mockScraper) Domain() string { return m.domain }
func (m *mockScraper) Name() string   { return m.name }
func (m *mockScraper) SearchOrBrowse(ctx context.Context, q string, page int) (*domain.ScrapeResult, error) {
	ch := 50
	return &domain.ScrapeResult{
		Items: []domain.ScrapedItem{
			{
				Title:         "Test Manhua",
				Slug:          "test-manhua",
				URLTemplate:   "https://test.com/chapter/{chapter}",
				CoverURL:      "https://test.com/cover.jpg",
				LastChapter:   &ch,
				PrimaryDomain: "test.com",
			},
		},
		Page:       page,
		TotalPages: 5,
	}, nil
}

func TestImportService_Browse(t *testing.T) {
	reg := providers.NewProviderRegistry()
	reg.Register(&mockScraper{domain: "test.com", name: "Test"})

	// Usamos mocks nulos de cache e repo para testar o fluxo de fallback do scraper
	svc := service.NewImportService(reg, nil, nil, nil)
	res, err := svc.Browse(context.Background(), "test.com", "", 1, nil)
	if err != nil {
		t.Fatalf("unexpected browse error: %v", err)
	}

	if len(res.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(res.Items))
	}
	if res.Items[0].Title != "Test Manhua" {
		t.Errorf("expected 'Test Manhua', got '%s'", res.Items[0].Title)
	}
}
```

- [ ] **Step 2: Rodar teste para verificar que falha**

Run: `cd apps/api-gateway && go test -v ./internal/service -run TestImportService`  
Expected: Falha de compilação por `service.NewImportService` inexistente.

- [ ] **Step 3: Implementar `apps/api-gateway/internal/service/import_service.go`**

```go
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/providers"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/repository"
)

type ImportAnnotatedItem struct {
	Title            string `json:"title"`
	Slug             string `json:"slug"`
	URLTemplate      string `json:"urlTemplate"`
	CoverURL         string `json:"coverUrl"`
	LastChapter      *int   `json:"lastChapter,omitempty"`
	PrimaryDomain    string `json:"primaryDomain"`
	Synopsis         string `json:"synopsis,omitempty"`
	AlreadyInCatalog bool   `json:"alreadyInCatalog"`
	AlreadyInLibrary bool   `json:"alreadyInLibrary"`
}

type ImportBrowseResult struct {
	Domain     string                `json:"domain"`
	Page       int                   `json:"page"`
	TotalPages int                   `json:"totalPages"`
	Items      []ImportAnnotatedItem `json:"items"`
}

type ImportPayloadItem struct {
	Title         string `json:"title"`
	Slug          string `json:"slug"`
	URLTemplate   string `json:"urlTemplate"`
	CoverURL      string `json:"coverUrl"`
	LastChapter   *int   `json:"lastChapter,omitempty"`
	PrimaryDomain string `json:"primaryDomain"`
	Synopsis      string `json:"synopsis,omitempty"`
}

type ImportResult struct {
	Status              string `json:"status"`
	ImportedCount       int    `json:"importedCount"`
	AddedToLibraryCount int    `json:"addedToLibraryCount"`
}

type ImportService struct {
	registry     *providers.ProviderRegistry
	redisService *repository.RedisService
	canonicalRepo repository.CanonicalRepository
	librarySvc   *LibraryService
}

func NewImportService(
	registry *providers.ProviderRegistry,
	redisService *repository.RedisService,
	canonicalRepo repository.CanonicalRepository,
	librarySvc *LibraryService,
) *ImportService {
	return &ImportService{
		registry:     registry,
		redisService: redisService,
		canonicalRepo: canonicalRepo,
		librarySvc:   librarySvc,
	}
}

func (s *ImportService) GetDomains() []providers.DomainInfo {
	return s.registry.ListDomains()
}

func (s *ImportService) Browse(ctx context.Context, domainName, query string, page int, userID *string) (*ImportBrowseResult, error) {
	cleanDomain := strings.ToLower(strings.TrimSpace(domainName))
	qClean := strings.ToLower(strings.TrimSpace(query))
	if page < 1 {
		page = 1
	}

	cacheKey := fmt.Sprintf("import:cache:%s:%s:%d", cleanDomain, qClean, page)

	var scrapeRes domain.ScrapeResult

	// 1. Tentar ler do Redis
	if s.redisService != nil && s.redisService.Client() != nil {
		cachedStr, err := s.redisService.Client().Get(ctx, cacheKey).Result()
		if err == nil && cachedStr != "" {
			_ = json.Unmarshal([]byte(cachedStr), &scrapeRes)
		}
	}

	// 2. Se não estiver no cache, chamar o scraper
	if len(scrapeRes.Items) == 0 {
		scraper, exists := s.registry.Get(cleanDomain)
		if !exists {
			return nil, fmt.Errorf("domínio '%s' não suportado para importação", domainName)
		}

		res, err := scraper.SearchOrBrowse(ctx, qClean, page)
		if err != nil {
			return nil, fmt.Errorf("falha ao buscar obras em %s: %w", domainName, err)
		}
		scrapeRes = *res

		// Salvar no Redis com TTL de 7 dias
		if s.redisService != nil && s.redisService.Client() != nil && len(scrapeRes.Items) > 0 {
			if bytes, err := json.Marshal(scrapeRes); err == nil {
				_ = s.redisService.Client().Set(ctx, cacheKey, string(bytes), 7*24*time.Hour).Err()
			}
		}
	}

	// 3. Anotar itens com status local
	annotated := make([]ImportAnnotatedItem, 0, len(scrapeRes.Items))
	for _, it := range scrapeRes.Items {
		slug := it.Slug
		if slug == "" {
			slug = strings.ToLower(strings.ReplaceAll(it.Title, " ", "-"))
		}

		inCatalog := false
		inLibrary := false

		if s.canonicalRepo != nil {
			if existing, _ := s.canonicalRepo.GetBySlug(ctx, slug); existing != nil {
				inCatalog = true
				if userID != nil && s.librarySvc != nil {
					// Verifica se o usuário tem na biblioteca
					libItems, _ := s.librarySvc.ListUserLibrary(ctx, *userID, false)
					for _, libItem := range libItems {
						if libItem.CanonicalManhuaID == existing.ID {
							inLibrary = true
							break
						}
					}
				}
			}
		}

		annotated = append(annotated, ImportAnnotatedItem{
			Title:            it.Title,
			Slug:             slug,
			URLTemplate:      it.URLTemplate,
			CoverURL:         it.CoverURL,
			LastChapter:      it.LastChapter,
			PrimaryDomain:    it.PrimaryDomain,
			Synopsis:         it.Synopsis,
			AlreadyInCatalog: inCatalog,
			AlreadyInLibrary: inLibrary,
		})
	}

	return &ImportBrowseResult{
		Domain:     domainName,
		Page:       scrapeRes.Page,
		TotalPages: scrapeRes.TotalPages,
		Items:      annotated,
	}, nil
}

func (s *ImportService) ImportWorks(ctx context.Context, userID string, items []ImportPayloadItem) (*ImportResult, error) {
	if len(items) == 0 {
		return &ImportResult{Status: "ok", ImportedCount: 0, AddedToLibraryCount: 0}, nil
	}

	canonicalItems := make([]*domain.CanonicalManhua, 0, len(items))
	for _, it := range items {
		slug := it.Slug
		if slug == "" {
			slug = strings.ToLower(strings.ReplaceAll(it.Title, " ", "-"))
		}

		syn := it.Synopsis
		cov := it.CoverURL

		canonicalItems = append(canonicalItems, &domain.CanonicalManhua{
			Slug:          slug,
			Title:         it.Title,
			Synopsis:      &syn,
			CoverURL:      &cov,
			PrimaryDomain: it.PrimaryDomain,
			URLTemplate:   it.URLTemplate,
			LastChapter:   it.LastChapter,
		})
	}

	if s.canonicalRepo != nil {
		if err := s.canonicalRepo.UpsertBatch(ctx, canonicalItems); err != nil {
			return nil, fmt.Errorf("failed to upsert canonical batch: %w", err)
		}
	}

	addedToLibrary := 0
	if userID != "" && s.librarySvc != nil && s.canonicalRepo != nil {
		for _, it := range canonicalItems {
			fetched, err := s.canonicalRepo.GetBySlug(ctx, it.Slug)
			if err != nil || fetched == nil {
				continue
			}

			ch := 1
			_, err = s.librarySvc.AddToLibrary(ctx, userID, fetched.ID, &ch, false)
			if err == nil {
				addedToLibrary++
			}
		}
	}

	return &ImportResult{
		Status:              "ok",
		ImportedCount:       len(canonicalItems),
		AddedToLibraryCount: addedToLibrary,
	}, nil
}
```

- [ ] **Step 4: Executar testes de unidade do service**

Run: `cd apps/api-gateway && go test -v ./internal/service/...`  
Expected: PASS com 100% de sucesso.

- [ ] **Step 5: Commit atômico**

```bash
cd apps/api-gateway
git add internal/service/import_service*
git commit -m "feat(service): add ImportService with Redis 7-day cache and library linking"
```

---

### Task 3: Handlers HTTP de Importação e Registro de Rotas no Servidor Go

**Files:**
- Create: `apps/api-gateway/internal/handlers/import_handler.go`
- Test: `apps/api-gateway/internal/handlers/import_handler_test.go`
- Modify: `apps/api-gateway/cmd/server/main.go`

**Interfaces:**
- Consumes: `service.ImportService`, JWT auth handler.
- Produces: Rotas HTTP `GET /api/import/domains`, `GET /api/import/browse`, `POST /api/import`.

- [ ] **Step 1: Escrever teste falho para o ImportHandler**

Criar `apps/api-gateway/internal/handlers/import_handler_test.go`:
```go
package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/handlers"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/providers"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/service"
)

func TestImportHandler_GetDomains(t *testing.T) {
	reg := providers.NewProviderRegistry()
	reg.Register(providers.NewAsuraScansScraper())

	svc := service.NewImportService(reg, nil, nil, nil)
	h := handlers.NewImportHandler(svc, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/import/domains", nil)
	w := httptest.NewRecorder()

	h.GetDomains(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}
```

- [ ] **Step 2: Rodar teste para verificar que falha**

Run: `cd apps/api-gateway && go test -v ./internal/handlers -run TestImportHandler`  
Expected: Falha de compilação por `handlers.NewImportHandler` não definido.

- [ ] **Step 3: Implementar `apps/api-gateway/internal/handlers/import_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/auth"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/service"
)

type ImportHandler struct {
	importSvc   *service.ImportService
	jwtVerifier auth.TokenVerifier
}

func NewImportHandler(importSvc *service.ImportService, jwtVerifier auth.TokenVerifier) *ImportHandler {
	return &ImportHandler{
		importSvc:   importSvc,
		jwtVerifier: jwtVerifier,
	}
}

func (h *ImportHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/import/domains", h.GetDomains)
	mux.HandleFunc("GET /api/import/browse", h.Browse)
	mux.HandleFunc("POST /api/import", h.ImportWorks)
}

func (h *ImportHandler) GetDomains(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	domains := h.importSvc.GetDomains()
	sendJSON(w, http.StatusOK, domains)
}

func (h *ImportHandler) Browse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	domain := strings.TrimSpace(q.Get("domain"))
	if domain == "" {
		sendJSONError(w, http.StatusBadRequest, "parâmetro 'domain' é obrigatório")
		return
	}

	query := strings.TrimSpace(q.Get("q"))
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	var userID *string
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") && h.jwtVerifier != nil {
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if claims, err := h.jwtVerifier.VerifyAccessToken(tokenStr); err == nil && claims != nil {
			uid := claims.UserID
			userID = &uid
		}
	}

	res, err := h.importSvc.Browse(r.Context(), domain, query, page, userID)
	if err != nil {
		sendJSONError(w, http.StatusBadGateway, err.Error())
		return
	}

	sendJSON(w, http.StatusOK, res)
}

func (h *ImportHandler) ImportWorks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") || h.jwtVerifier == nil {
		sendJSONError(w, http.StatusUnauthorized, "Token de autenticação obrigatório")
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.jwtVerifier.VerifyAccessToken(tokenStr)
	if err != nil || claims == nil {
		sendJSONError(w, http.StatusUnauthorized, "Token inválido ou expirado")
		return
	}

	var payload struct {
		Items []service.ImportPayloadItem `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		sendJSONError(w, http.StatusBadRequest, "Corpo de requisição JSON inválido")
		return
	}

	res, err := h.importSvc.ImportWorks(r.Context(), claims.UserID, payload.Items)
	if err != nil {
		sendJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	sendJSON(w, http.StatusOK, res)
}
```

- [ ] **Step 4: Atualizar `apps/api-gateway/cmd/server/main.go` para registrar as rotas de importação**

Instanciar `ProviderRegistry`, registrar `asurascans`, `ravenscans`, `mangak` e `manhuatop`, instanciar `ImportService` e `ImportHandler`, e registrar rotas.

- [ ] **Step 5: Executar suíte de testes de handlers e compilar o servidor**

Run: `cd apps/api-gateway && go test -v ./internal/handlers/...`  
Run: `cd apps/api-gateway && go build cmd/server/main.go`  
Expected: Testes passando e binário compilando sem erros.

- [ ] **Step 6: Commit atômico**

```bash
cd apps/api-gateway
git add internal/handlers/import_handler* cmd/server/main.go
git commit -m "feat(api): register /api/import routes with authentication and validation"
```

---

### Task 4: Rotina de Carga Inicial de Catálogo (`cmd/sync-catalog`) e Makefile

**Files:**
- Create: `apps/api-gateway/cmd/sync-catalog/main.go`
- Modify: `Makefile`

**Interfaces:**
- Consumes: `repository.PostgresCanonicalRepository`, `providers.ProviderRegistry`.
- Produces: Executável CLI `sync-catalog` e target do Makefile `make sync-catalog`.

- [ ] **Step 1: Criar o script CLI `apps/api-gateway/cmd/sync-catalog/main.go`**

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/domain"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/providers"
	"github.com/thiagofdso/manhua-manager-pro/apps/api-gateway/internal/repository"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://manhua_user:manhua_secure_password_change_me@localhost:5432/manhua_pro?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Falha ao conectar no PostgreSQL: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Banco de dados inacessível: %v", err)
	}

	repo := repository.NewPostgresCanonicalRepository(db)

	reg := providers.NewProviderRegistry()
	reg.Register(providers.NewAsuraScansScraper())
	reg.Register(providers.NewRavenScansScraper())
	reg.Register(providers.NewMangaKScraper())
	reg.Register(providers.NewManhuaTopScraper())

	log.Println("🚀 Iniciando sincronização do catálogo popular das plataformas...")

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	totalIngested := 0

	for _, d := range reg.ListDomains() {
		scraper, _ := reg.Get(d.Domain)
		log.Printf("📥 Coletando obras populares de %s (%s)...", d.Name, d.Domain)

		for page := 1; page <= 2; page++ {
			res, err := scraper.SearchOrBrowse(ctx, "", page)
			if err != nil {
				log.Printf("⚠️ Erro ao buscar página %d de %s: %v", page, d.Domain, err)
				continue
			}

			if len(res.Items) == 0 {
				continue
			}

			var batch []*domain.CanonicalManhua
			for _, it := range res.Items {
				slug := it.Slug
				if slug == "" {
					slug = strings.ToLower(strings.ReplaceAll(it.Title, " ", "-"))
				}
				cov := it.CoverURL
				syn := it.Synopsis

				batch = append(batch, &domain.CanonicalManhua{
					Slug:          slug,
					Title:         it.Title,
					Synopsis:      &syn,
					CoverURL:      &cov,
					PrimaryDomain: it.PrimaryDomain,
					URLTemplate:   it.URLTemplate,
					LastChapter:   it.LastChapter,
				})
			}

			if err := repo.UpsertBatch(ctx, batch); err != nil {
				log.Printf("⚠️ Erro no UpsertBatch da página %d de %s: %v", page, d.Domain, err)
				continue
			}

			totalIngested += len(batch)
			log.Printf("  ✅ Página %d: %d obras sincronizadas", page, len(batch))
			time.Sleep(500 * time.Millisecond)
		}
	}

	log.Printf("🎉 Sincronização concluída com sucesso! Total de obras processadas/atualizadas: %d\n", totalIngested)
}
```

- [ ] **Step 2: Adicionar target no `Makefile` raiz**

Adicionar em `Makefile`:
```makefile
sync-catalog: ## Sincroniza catálogo inicial com obras populares dos provedores externos
	@echo "Sincronizando catalogo inicial..."
	@cd apps/api-gateway && DATABASE_URL="postgres://manhua_user:manhua_secure_password_change_me@localhost:5432/manhua_pro?sslmode=disable" go run cmd/sync-catalog/main.go
```

- [ ] **Step 3: Testar execução de compilação do `sync-catalog`**

Run: `cd apps/api-gateway && go build -o /tmp/sync-catalog cmd/sync-catalog/main.go`  
Expected: Compilado com sucesso.

- [ ] **Step 4: Commit atômico**

```bash
git add apps/api-gateway/cmd/sync-catalog/main.go Makefile
git commit -m "feat(catalog): add sync-catalog CLI and make target for initial popular works ingestion"
```

---

### Task 5: Angular Core Import Service e Modelos

**Files:**
- Create: `apps/web-client/src/app/core/models/import.model.ts`
- Create: `apps/web-client/src/app/core/services/import.service.ts`
- Test: `apps/web-client/src/app/core/services/import.service.spec.ts`

**Interfaces:**
- Produces: `ImportDomain`, `ImportAnnotatedItem`, `ImportBrowseResponse`, `ImportResult`.
- Produces: `ImportService` injetável com `getDomains()`, `browse()`, `importWorks()`.

- [ ] **Step 1: Criar modelos TypeScript `apps/web-client/src/app/core/models/import.model.ts`**

```typescript
export interface ImportDomain {
  domain: string;
  name: string;
  supported: boolean;
}

export interface ImportAnnotatedItem {
  title: string;
  slug: string;
  urlTemplate: string;
  coverUrl: string;
  lastChapter?: number;
  primaryDomain: string;
  synopsis?: string;
  alreadyInCatalog: boolean;
  alreadyInLibrary: boolean;
}

export interface ImportBrowseResponse {
  domain: string;
  page: number;
  totalPages: number;
  items: ImportAnnotatedItem[];
}

export interface ImportResult {
  status: string;
  importedCount: number;
  addedToLibraryCount: number;
}
```

- [ ] **Step 2: Escrever teste unitário falho para `ImportService`**

Criar `apps/web-client/src/app/core/services/import.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportService } from './import.service';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportService]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get domains list', () => {
    service.getDomains().subscribe(domains => {
      expect(domains.length).toBe(1);
      expect(domains[0].domain).toBe('asurascans.com');
    });

    const req = httpMock.expectOne('/api/import/domains');
    expect(req.request.method).toBe('GET');
    req.flush([{ domain: 'asurascans.com', name: 'Asura Scans', supported: true }]);
  });
});
```

- [ ] **Step 3: Implementar `apps/web-client/src/app/core/services/import.service.ts`**

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportDomain, ImportBrowseResponse, ImportAnnotatedItem, ImportResult } from '../models/import.model';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/import';

  getDomains(): Observable<ImportDomain[]> {
    return this.http.get<ImportDomain[]>(`${this.baseUrl}/domains`);
  }

  browse(domain: string, query?: string, page: number = 1): Observable<ImportBrowseResponse> {
    let params = new HttpParams()
      .set('domain', domain)
      .set('page', page.toString());

    if (query && query.trim()) {
      params = params.set('q', query.trim());
    }

    return this.http.get<ImportBrowseResponse>(`${this.baseUrl}/browse`, { params });
  }

  importWorks(items: ImportAnnotatedItem[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(this.baseUrl, { items });
  }
}
```

- [ ] **Step 4: Executar testes de unidade do Angular**

Run: `cd apps/web-client && npm test -- --watch=false --include=src/app/core/services/import.service.spec.ts`  
Expected: PASS com 100% de sucesso.

- [ ] **Step 5: Commit atômico**

```bash
cd apps/web-client
git add src/app/core/models/import.model.ts src/app/core/services/import.service*
git commit -m "feat(web): add ImportService and models for domain browsing and batch import"
```

---

### Task 6: Angular Import Dialog Component e Integração com o Catálogo

**Files:**
- Create: `apps/web-client/src/app/features/catalog/import-dialog.component.ts`
- Test: `apps/web-client/src/app/features/catalog/import-dialog.component.spec.ts`
- Modify: `apps/web-client/src/app/features/catalog/catalog-list.component.ts`

**Interfaces:**
- Produces: `ImportDialogComponent` com `@Output() closed = new EventEmitter<boolean>()`.
- Consumes: `ImportService`, `AuthService`.
- Conforms to: `PRODUCT.md` e `DESIGN.md` (Design System Impeccable).

- [ ] **Step 1: Escrever teste unitário para `ImportDialogComponent`**

Criar `apps/web-client/src/app/features/catalog/import-dialog.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImportDialogComponent } from './import-dialog.component';
import { of } from 'rxjs';
import { ImportService } from '../../core/services/import.service';

describe('ImportDialogComponent', () => {
  let component: ImportDialogComponent;
  let fixture: ComponentFixture<ImportDialogComponent>;
  let mockImportService: jasmine.SpyObj<ImportService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj('ImportService', ['getDomains', 'browse', 'importWorks']);
    mockImportService.getDomains.and.returnValue(of([
      { domain: 'asurascans.com', name: 'Asura Scans', supported: true }
    ]));
    mockImportService.browse.and.returnValue(of({
      domain: 'asurascans.com',
      page: 1,
      totalPages: 1,
      items: []
    }));

    await TestBed.configureTestingModule({
      imports: [ImportDialogComponent, HttpClientTestingModule],
      providers: [
        { provide: ImportService, useValue: mockImportService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load domains on init', () => {
    expect(component).toBeTruthy();
    expect(mockImportService.getDomains).toHaveBeenCalled();
  });

  it('should toggle selection of items', () => {
    const item = {
      title: 'Solo Leveling',
      slug: 'solo-leveling',
      urlTemplate: 'https://...',
      coverUrl: 'https://...',
      primaryDomain: 'asurascans.com',
      alreadyInCatalog: false,
      alreadyInLibrary: false
    };

    component.toggleSelection(item);
    expect(component.selectedItems().size).toBe(1);

    component.toggleSelection(item);
    expect(component.selectedItems().size).toBe(0);
  });
});
```

- [ ] **Step 2: Implementar `apps/web-client/src/app/features/catalog/import-dialog.component.ts`**

Componente completo em conformidade com `PRODUCT.md` e `DESIGN.md`:
- Fundo escuro profundo `#090d16`, superfície `#0f172a`, inputs `#141c2e`.
- Botões primários Índigo sólido `#6366f1` (hover `#4f46e5`).
- WCAG AA com contraste $\ge 4.5:1$ e áreas de toque $\ge 44\times 44\text{px}$.
- Badges sem degradê com status claro (*"Na sua biblioteca"*, *"No Catálogo"*, *"Cap. X"*).
- Checkbox "Selecionar todos da página", contador de selecionados, paginação e botão "Importar (X)".

- [ ] **Step 3: Modificar `apps/web-client/src/app/features/catalog/catalog-list.component.ts`**

- Adicionar botão **`📥 Importar Obras`** no cabeçalho ao lado do título.
- Adicionar signal `showImportModal = signal<boolean>(false)`.
- Adicionar `<app-import-dialog *ngIf="showImportModal()" (closed)="onImportDialogClosed($event)"></app-import-dialog>`.
- Ao fechar com sucesso (`$event === true`), chamar `loadCatalog()` para atualizar a grade com as novas obras importadas.

- [ ] **Step 4: Executar testes do Angular**

Run: `cd apps/web-client && npm test -- --watch=false --browsers=ChromeHeadless`  
Expected: 100% dos testes passando.

- [ ] **Step 5: Commit atômico**

```bash
cd apps/web-client
git add src/app/features/catalog/import-dialog* src/app/features/catalog/catalog-list*
git commit -m "feat(web): integrate ImportDialogComponent with Impeccable design system into catalog"
```

---

### Task 7: Validação Ponta a Ponta, Execução do `sync-catalog` e Verificação Visual

**Files:**
- Modify/Verify: PostgreSQL 16 `canonical_manhuas`
- Run: `make sync-catalog`
- Verify: Web Client `http://localhost:4200/catalog`

- [ ] **Step 1: Executar `make sync-catalog` localmente**

Run: `make sync-catalog`  
Expected: Ingestão de dezenas de obras reais de AsuraScans, RavenScans, MangaK e ManhuaTop com status 200.

- [ ] **Step 2: Verificar contagem no PostgreSQL**

Run: `docker exec -i manhua-postgres-dev psql -U manhua_user -d manhua_pro -c "SELECT count(*), primary_domain FROM canonical_manhuas GROUP BY primary_domain;"`  
Expected: Contagem $\ge 50$ obras no total distribuídas entre as plataformas.

- [ ] **Step 3: Testar os endpoints de importação via `curl`**

Run: `curl -s http://localhost:8080/api/import/domains | jq`  
Expected: Lista JSON com os domínios suportados.

Run: `curl -s "http://localhost:8080/api/import/browse?domain=asurascans.com&page=1" | jq .items[0]`  
Expected: Primeiro item com título real, capa real, urlTemplate e flags `alreadyInCatalog`.

- [ ] **Step 4: Capturar screenshot da interface web com o modal de importação**

Tirar screenshot da tela `/catalog` com o modal aberto para conferência visual do design Impeccable.

- [ ] **Step 5: Commit final e push para o branch `desenv` em todos os repositórios**

```bash
git push origin desenv
cd apps/api-gateway && git push origin desenv
cd ../web-client && git push origin desenv
```
