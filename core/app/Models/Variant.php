<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    protected $table = 'datasets__variants';

    public function type()
    {
        return $this->hasOne(VariantType::class, 'id', 'type_id');
    }
}
