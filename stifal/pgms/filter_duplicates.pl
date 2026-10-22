open FILE,"$ARGV[0]" || die "Type 'perl coverage.pl all_zscore_file'\n";
@file= <FILE>;
close (FILE);

foreach(@file)
{
	chomp ($_);
	if($_ =~/^\*\*\*\*(\w+)/)
	{
		$kk = $1;
	}
	elsif($_ =~ /^>/ || $_ =~/^Z-SCORE/)
	{	
		$full{$kk} .= $_ ;
		$full{$kk} .= "[[[";
	}
}

foreach $kk (keys %full)
{
#        print "$kk ==== $full{$kk}\n";
	print "****$kk\n";
	@cal = split (/\[\[\[/,$full{$kk});
        foreach(@cal)
        {
	#	print "$_\n";	
		if($_ =~ /^>/)
		{
			$kkk = $_ ;
		}
		elsif($_ =~ /^Z-SCORE/)
		{
			$hhh{$kkk} .= $_. "+++";
		}
	}
	foreach $kkk (keys %hhh)
	{
		print "$kkk\n";
		@spl = split(/\+\+\+/,$hhh{$kkk});
		foreach(@spl)
		{
#			print "GG :: $_\n";
			@spl_zs = split(/\t+|\s+/,$_);
			#print "$spl_zs[3] || $spl_zs[0] || $spl_zs[1] || $spl_zs[2] || $spl_zs[4] || $spl_zs[5]\n";
			$key = $spl_zs[3];
			$hash{$key} = $spl_zs[0]."++".$spl_zs[1]."++".$spl_zs[2]."++".$spl_zs[4]."++".$spl_zs[5]."**";
		}
		foreach $key (keys %hash)
		{
#			print "$key\n";
			#print "^^^^ $hash{$key}\n";
			@spl_fin = split(/\+\+|\*\*/,$hash{$key});
			print "$spl_fin[0]\t$spl_fin[1]\t$spl_fin[2]\t$key\t$spl_fin[3]\t$spl_fin[4]\t$spl_fin[5]\n";
		}
		print "\n";
	undef %hash;
	}
undef %hhh;
}


=d
foreach $kk (keys %full)
{
	#print "$kk ==== $full{$kk}\n";
	print "****$kk\n";
	@cal = split (/\[\[\[/,$full{$kk});	
	foreach(@cal)
	{
	if ($_ =~ /^>/)
	{
		$key = $_;
	}
	elsif($_ =~/^Z-SCORE/)
	{	
		$hash{$key} .=$_;
		$hash{$key} .="+++";
	}
	}

foreach $key (keys %hash)
{
#	print "$key ++++++++++ $hash{$key}\n";
	print "$key\n";
	@spkee = split(/\||>/,$key);
	push(@names,$spkee[6]);
	$nu_de = $spkee[1];
#	print "^^^^^^^^^^^^$spkee[1] || $spkee[6] || $spkee[5]\n";
	push(@fac,$spkee[6].'*');
	#print "NAMES :: @names\n";
	#print "$hash{$key}\n";
	@sp=split(/\+\+\+/,$hash{$key});
#	print "KKK@sp\n";
	foreach(@sp)
	{
#		print "$_\n";
		@split = split(/\s+|\t+|::/,$_);
		#print "!!!!!!!!@split\n";
	#	print "~~~~~~~~~~~~~~~~~~~~~$split[2] ~~~~~~ $split[7]\n";
		push(@zsco,$split[2]);
		push(@zsco_full,$split[0]."Y".$split[2]."Y".$split[3]."Y".$split[4]."Y".$split[5]."Y".$split[6]."Y");
	}
	#print "ZSC :: @zsco \n";
	@sort = sort {$b <=> $a} @zsco;	
#	print "MAX :: $sort[0]\n";
#	print "FULL :: @zsco_full\n";
	foreach(@zsco_full)
	{
	#	print "$_\n";
		@spl_zs = split(/Y/,$_);
		if($sort[0] eq $spl_zs[1])
		{
			print "@spl_zs\n";
			$hits++;
			$gene_hits++;
			$entire++;
		}
	}
		print " PAR::$hits\n";
		push(@fac,$hits."[[");
		$jofff = join(/ /,@fac);
	        $NU_DE{$nu_de} = $jofff;
		#print "JOJOJJ :: $jofff\n";
$hits = ();
@zsco = @zsco_full=();
}
@fac =();
print "SINGLE GENE :: $gene_hits\n";	
$gene_hits = ();
undef(%hash);
}
print "ENTIRE :: $entire\n";

undef %seen1;
#print "@names\n";
@uniq_names = grep {! $seen1{$_} ++} @names;


for($i=0;$i<=$#uniq_names;$i++)
{
        foreach $nu_de (keys %NU_DE)
        {
#               print "$nu_de +++++++++++++++++ $NU_DE{$nu_de}\n";
                foreach ($nu_de)
                {
 #                      print "KKK$NU_DE{$nu_de}\n";
                        @splivalue = split(/\[\[/,$NU_DE{$nu_de});
                        foreach(@splivalue)
                        {
                        #       print "SSSSSSSSSSSS $_\n";
                                @spcal = split (/\*/,$_);
               #                 print "$spcal[0] }}}} $spcal[1] \n";
                                if($uniq_names[$i] eq $spcal[0])
                                {
                                        $sum += $spcal[1];
                                }
                        }
                }
        }
        print "TOTAL HITS OF A SINGLE GENE :: $uniq_names[$i] :: $sum\n";
                                $sum = 0;
#print "\n";
}

