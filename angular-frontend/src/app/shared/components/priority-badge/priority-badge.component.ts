import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <span class="priority-badge" [ngClass]="'priority-' + priority">
      {{ label }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class PriorityBadgeComponent {
  @Input() priority: string = 'medium';

  get label(): string {
    return this.priority.replace('_', ' ');
  }
}
