import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Produto } from '../model/produto';
import { ProdutoService } from '../services/produto.service';
import { buscarProdutos } from '../services/busca';

@Component({
  imports: [CommonModule],
  selector: 'app-busca',
  styleUrl: './busca.css',
  templateUrl: './busca.html',
})
export class Busca {
  private readonly router = inject(Router);
  private readonly produtos = inject(ProdutoService).lista;

  readonly termo = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((p) => p.get('q') ?? '')),
    { initialValue: '' },
  );

  readonly resultado = computed(() => buscarProdutos(this.produtos, this.termo()));
  readonly temTermo = computed(() => this.termo().trim().length > 0);

  digitar(valor: string) {
    this.router.navigate(['/busca'], {
      queryParams: { q: valor || null },
      replaceUrl: true,
    });
  }

  verDetalhe(obj: Produto) {
    localStorage.setItem('produto', JSON.stringify(obj));
    location.href = './product-details';
  }

  calcularDesconto(valor: number, valorPromo: number): number {
    return Math.round(((valor - valorPromo) / valor) * 100);
  }
}
