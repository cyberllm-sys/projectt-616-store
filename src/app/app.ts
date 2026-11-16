import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly title = signal('project-616-store');

  /** Texto da barra de busca do cabeçalho (sincronizado com ?q= da rota /busca). */
  protected readonly termo = signal('');

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.parseUrl(this.router.url);
      const naBusca = url.root.children['primary']?.segments[0]?.path === 'busca';
      this.termo.set(naBusca ? (url.queryParams['q'] ?? '') : '');
    });
  }

  /** Busca conforme digitado: atualiza a URL e a tela de busca filtra em tempo real. */
  protected digitar(valor: string) {
    this.termo.set(valor);
    this.router.navigate(['/busca'], { queryParams: { q: valor || null }, replaceUrl: true });
  }
}
